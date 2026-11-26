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

// Header + data pembayaran (tanpa payment gateway: pembayaran dicatat & diverifikasi manual oleh admin).
const SELECT_HEADER = `SELECT t.*, u.nama AS nama_pelanggan,
                              b.metode_pembayaran, b.status_pembayaran, b.tanggal_pembayaran
                       FROM header_transaksi t
                       JOIN users u ON u.id_user = t.id_user
                       LEFT JOIN pembayaran b ON b.id_transaksi = t.id_transaksi`;

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

// POST /api/transactions (pelanggan) -> CHECKOUT dari keranjang
// Body: { "metode_pembayaran": "tunai" | "transfer" | "qris" }  (default: tunai)
// Semua langkah (baca keranjang, cek stok, buat header, buat detail, kurangi stok, catat pembayaran,
// kosongkan keranjang) berada dalam SATU transaksi database: berhasil semua atau batal semua.
exports.create = asyncHandler(async (req, res) => {
  const metode = req.body.metode_pembayaran || 'tunai';

  const conn = await db.getConnection(); // satu koneksi khusus untuk satu transaksi
  let idBaru;
  try {
    await conn.beginTransaction();

    // Kunci keranjang: mencegah checkout ganda (klik dua kali) memproses isi keranjang yang sama.
    const [k] = await conn.execute('SELECT id_keranjang FROM keranjang WHERE id_user = ? FOR UPDATE', [req.user.id_user]);
    if (!k.length) throw new AppError('Keranjang kosong', 400);
    const idKeranjang = k[0].id_keranjang;

    // Urut id_product agar dua checkout bersamaan mengunci produk dengan urutan sama (cegah deadlock).
    const [isi] = await conn.execute(
      'SELECT id_product, jumlah FROM detail_keranjang WHERE id_keranjang = ? ORDER BY id_product',
      [idKeranjang]
    );
    if (!isi.length) throw new AppError('Keranjang kosong', 400);

    let total = 0;
    const baris = [];
    for (const it of isi) {
      // FOR UPDATE mengunci baris produk sampai commit, sehingga stok tidak bisa dipakai checkout lain.
      const [rows] = await conn.execute(
        'SELECT id_product, nama_produk, harga_produk, stok FROM products WHERE id_product = ? FOR UPDATE',
        [it.id_product]
      );
      if (!rows.length) throw new AppError(`Produk dengan id ${it.id_product} tidak ditemukan`, 404);
      const p = rows[0];
      if (p.stok < it.jumlah) throw new AppError(`Stok ${p.nama_produk} tidak cukup (tersisa ${p.stok})`, 409);

      // Harga diambil dari tabel products saat checkout (bukan harga lama di keranjang).
      const subtotal = Math.round(p.harga_produk * it.jumlah * 100) / 100;
      total = Math.round((total + subtotal) * 100) / 100;
      baris.push({ idp: it.id_product, jumlah: it.jumlah, harga: p.harga_produk, subtotal });
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

    // Pembayaran manual: dicatat "belum_bayar", dikonfirmasi admin nanti.
    await conn.execute(
      "INSERT INTO pembayaran (id_transaksi, metode_pembayaran, jumlah_pembayaran, status_pembayaran) VALUES (?, ?, ?, 'belum_bayar')",
      [idBaru, metode, total]
    );

    await conn.execute('DELETE FROM detail_keranjang WHERE id_keranjang = ?', [idKeranjang]);
    await conn.commit();
  } catch (err) {
    await conn.rollback(); // ada yang gagal -> semua perubahan di atas dibatalkan
    throw err;
  } finally {
    conn.release(); // koneksi dikembalikan ke pool, WAJIB walau error
  }

  success(res, await ambilLengkap(idBaru), 'Checkout berhasil. Silakan lakukan pembayaran sesuai metode yang dipilih.', 201);
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

    const [[bayar]] = await conn.execute('SELECT status_pembayaran FROM pembayaran WHERE id_transaksi = ? FOR UPDATE', [id]);
    const statusBayar = bayar ? bayar.status_pembayaran : null;

    // Pelanggan tidak boleh membatalkan sendiri jika pembayaran sudah diterima/sedang diverifikasi
    // (perlu penanganan pengembalian dana oleh admin).
    if (pemilik !== null && (statusBayar === 'berhasil' || statusBayar === 'menunggu_verifikasi')) {
      throw new AppError('Pembayaran sudah dikirim/diterima, hubungi admin untuk pembatalan', 409);
    }
    // Pesanan hanya boleh selesai kalau sudah dibayar.
    if (statusBaru === 'selesai' && statusBayar !== 'berhasil') {
      throw new AppError('Transaksi belum bisa diselesaikan: pembayaran belum dikonfirmasi', 409);
    }

    if (statusBaru === 'dibatalkan') {
      const [items] = await conn.execute('SELECT id_product, jumlah FROM detail_transaksi WHERE id_transaksi = ?', [id]);
      for (const it of items) {
        await conn.execute('UPDATE products SET stok = stok + ? WHERE id_product = ?', [it.jumlah, it.id_product]);
      }
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

// Ambil transaksi + pembayarannya dengan kunci baris, untuk dua endpoint pembayaran di bawah.
async function kunciPembayaran(conn, id, pemilik) {
  let sql = `SELECT t.status_transaksi, b.metode_pembayaran, b.status_pembayaran
             FROM header_transaksi t JOIN pembayaran b ON b.id_transaksi = t.id_transaksi
             WHERE t.id_transaksi = ?`;
  const params = [id];
  if (pemilik !== null) {
    sql += ' AND t.id_user = ?';
    params.push(pemilik);
  }
  const [rows] = await conn.execute(`${sql} FOR UPDATE`, params);
  if (!rows.length) throw new AppError('Transaksi tidak ditemukan', 404);
  if (rows[0].status_transaksi === 'dibatalkan') throw new AppError('Transaksi sudah dibatalkan', 409);
  return rows[0];
}

async function dalamTransaksi(fn) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await fn(conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// PATCH /api/transactions/:id/payment/confirm (pelanggan)
// "Saya sudah transfer/bayar QRIS" -> status pembayaran menjadi menunggu_verifikasi.
// Pembayaran tunai tidak perlu langkah ini (dibayar di toko, admin yang mengonfirmasi).
exports.confirmPayment = asyncHandler(async (req, res) => {
  await dalamTransaksi(async (conn) => {
    const b = await kunciPembayaran(conn, req.params.id, req.user.id_user);
    if (b.metode_pembayaran === 'tunai') {
      throw new AppError('Pembayaran tunai dikonfirmasi admin saat pembayaran di toko', 409);
    }
    if (!['belum_bayar', 'ditolak'].includes(b.status_pembayaran)) {
      throw new AppError(`Pembayaran berstatus ${b.status_pembayaran}, tidak bisa dikonfirmasi lagi`, 409);
    }
    await conn.execute("UPDATE pembayaran SET status_pembayaran = 'menunggu_verifikasi' WHERE id_transaksi = ?", [
      req.params.id,
    ]);
  });
  success(res, await ambilLengkap(req.params.id), 'Konfirmasi pembayaran dikirim, menunggu verifikasi admin');
});

// PATCH /api/transactions/:id/payment (admin)  Body: { "status_pembayaran": "berhasil" | "ditolak" }
exports.verifyPayment = asyncHandler(async (req, res) => {
  const baru = req.body.status_pembayaran;
  await dalamTransaksi(async (conn) => {
    const b = await kunciPembayaran(conn, req.params.id, null);
    if (b.status_pembayaran === 'berhasil') throw new AppError('Pembayaran sudah dikonfirmasi berhasil', 409);
    if (baru === 'ditolak' && b.status_pembayaran === 'ditolak') throw new AppError('Pembayaran sudah ditolak', 409);

    await conn.execute(
      'UPDATE pembayaran SET status_pembayaran = ?, tanggal_pembayaran = ? WHERE id_transaksi = ?',
      [baru, baru === 'berhasil' ? new Date() : null, req.params.id]
    );
  });
  success(res, await ambilLengkap(req.params.id), baru === 'berhasil' ? 'Pembayaran dikonfirmasi' : 'Pembayaran ditolak');
});
