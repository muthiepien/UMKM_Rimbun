const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

// Status yang boleh dituju dari status sekarang. "selesai" dan "dibatalkan" adalah status akhir.
const ALUR = {
  menunggu_konfirmasi: ['diproses', 'dibatalkan'],
  diproses: ['siap_diambil', 'dibatalkan'],
  siap_diambil: ['selesai', 'dibatalkan'],
  selesai: [],
  dibatalkan: [],
};

const SELECT_HEADER = `SELECT t.*, u.nama AS nama_pelanggan
                       FROM header_transaksi t JOIN users u ON u.id_user = t.id_user`;

// Header + daftar barang (JOIN products untuk nama produk).
async function ambilLengkap(id) {
  const [head] = await db.execute(`${SELECT_HEADER} WHERE t.id_transaksi = ?`, [id]);
  if (!head.length) return null;
  const [items] = await db.execute(
    `SELECT d.id_product, p.nama_produk, d.jumlah, d.harga_satuan, d.subtotal
     FROM detail_transaksi d JOIN products p ON p.id_product = d.id_product
     WHERE d.id_transaksi = ? ORDER BY d.id_detail_transaksi`,
    [id]
  );
  return { ...head[0], items };
}

// POST /api/transactions (pelanggan) -> checkout
// Semua langkah (cek stok, buat header, buat detail, kurangi stok) berada dalam SATU transaksi database:
// berhasil semua atau batal semua.
exports.create = asyncHandler(async (req, res) => {
  // Gabungkan item dengan produk yang sama, mis. [{1,x2},{1,x3}] menjadi produk 1 x5.
  const gabung = new Map();
  for (const it of req.body.items) {
    const idp = Number(it.id_product);
    gabung.set(idp, (gabung.get(idp) || 0) + Number(it.jumlah));
  }
  // Selalu kunci produk dari id terkecil agar dua checkout bersamaan tidak saling menunggu (deadlock).
  const ids = [...gabung.keys()].sort((a, b) => a - b);

  const conn = await db.getConnection(); // satu koneksi khusus untuk satu transaksi
  let idBaru;
  try {
    await conn.beginTransaction();

    let total = 0;
    const baris = [];
    for (const idp of ids) {
      const jumlah = gabung.get(idp);
      // FOR UPDATE mengunci baris produk sampai commit, sehingga stok tidak bisa dipakai checkout lain.
      const [rows] = await conn.execute(
        'SELECT id_product, nama_produk, harga_produk, stok FROM products WHERE id_product = ? FOR UPDATE',
        [idp]
      );
      if (!rows.length) throw new AppError(`Produk dengan id ${idp} tidak ditemukan`, 404);
      const p = rows[0];
      if (p.stok < jumlah) throw new AppError(`Stok ${p.nama_produk} tidak cukup (tersisa ${p.stok})`, 409);

      const subtotal = Math.round(p.harga_produk * jumlah * 100) / 100;
      total = Math.round((total + subtotal) * 100) / 100;
      baris.push({ idp, jumlah, harga: p.harga_produk, subtotal });
    }

    const [h] = await conn.execute('INSERT INTO header_transaksi (id_user, total_harga) VALUES (?, ?)', [
      req.user.id_user,
      total,
    ]);
    idBaru = h.insertId;

    for (const b of baris) {
      await conn.execute(
        'INSERT INTO detail_transaksi (id_transaksi, id_product, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)',
        [idBaru, b.idp, b.jumlah, b.harga, b.subtotal]
      );
      await conn.execute('UPDATE products SET stok = stok - ? WHERE id_product = ?', [b.jumlah, b.idp]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback(); // ada yang gagal -> semua perubahan di atas dibatalkan
    throw err;
  } finally {
    conn.release(); // koneksi dikembalikan ke pool, WAJIB walau error
  }

  success(res, await ambilLengkap(idBaru), 'Transaksi berhasil dibuat', 201);
});

// GET /api/transactions?status=diproses -> pelanggan: miliknya sendiri, admin: semua
exports.list = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role !== 'admin') {
    where.push('t.id_user = ?');
    params.push(req.user.id_user);
  }
  if (req.query.status) {
    where.push('t.status_transaksi = ?');
    params.push(req.query.status);
  }
  const sql = `${SELECT_HEADER}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY t.id_transaksi DESC`;
  const [rows] = await db.execute(sql, params);
  success(res, rows);
});

// GET /api/transactions/:id -> pelanggan hanya boleh melihat miliknya
exports.detail = asyncHandler(async (req, res) => {
  const data = await ambilLengkap(req.params.id);
  // Transaksi milik orang lain dibalas 404 (bukan 403) agar tidak membocorkan bahwa id itu ada.
  if (!data || (req.user.role !== 'admin' && data.id_user !== req.user.id_user)) {
    throw new AppError('Transaksi tidak ditemukan', 404);
  }
  success(res, data);
});

// Mengubah status di dalam transaksi database. Jika menjadi "dibatalkan", stok dikembalikan.
// pemilik = id_user pelanggan (batalkan sendiri) atau null (admin).
async function ubahStatus(id, statusBaru, pemilik) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let sql = 'SELECT status_transaksi FROM header_transaksi WHERE id_transaksi = ?';
    const params = [id];
    if (pemilik !== null) {
      sql += ' AND id_user = ?';
      params.push(pemilik);
    }
    const [rows] = await conn.execute(`${sql} FOR UPDATE`, params);
    if (!rows.length) throw new AppError('Transaksi tidak ditemukan', 404);

    const sekarang = rows[0].status_transaksi;
    if (!ALUR[sekarang].includes(statusBaru)) {
      throw new AppError(`Status tidak bisa diubah dari ${sekarang} ke ${statusBaru}`, 409);
    }
    // Pelanggan hanya boleh membatalkan selagi belum diproses admin.
    if (pemilik !== null && sekarang !== 'menunggu_konfirmasi') {
      throw new AppError('Transaksi sudah diproses, tidak bisa dibatalkan oleh pelanggan', 409);
    }

    if (statusBaru === 'dibatalkan') {
      await conn.execute(
        `UPDATE products p JOIN detail_transaksi d ON d.id_product = p.id_product
         SET p.stok = p.stok + d.jumlah WHERE d.id_transaksi = ?`,
        [id]
      );
    }
    await conn.execute('UPDATE header_transaksi SET status_transaksi = ? WHERE id_transaksi = ?', [statusBaru, id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// PATCH /api/transactions/:id/status (admin)
exports.updateStatus = asyncHandler(async (req, res) => {
  await ubahStatus(req.params.id, req.body.status, null);
  success(res, await ambilLengkap(req.params.id), 'Status transaksi diperbarui');
});

// PATCH /api/transactions/:id/cancel (pelanggan)
exports.cancel = asyncHandler(async (req, res) => {
  await ubahStatus(req.params.id, 'dibatalkan', req.user.id_user);
  success(res, await ambilLengkap(req.params.id), 'Transaksi dibatalkan');
});
