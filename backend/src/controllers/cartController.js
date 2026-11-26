const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { toUrl } = require('../utils/url');

// Satu user = satu keranjang (id_user UNIQUE). Dibuat otomatis saat pertama dibutuhkan.
async function ambilIdKeranjang(conn, idUser) {
  await conn.execute('INSERT IGNORE INTO keranjang (id_user) VALUES (?)', [idUser]);
  const [rows] = await conn.execute('SELECT id_keranjang FROM keranjang WHERE id_user = ?', [idUser]);
  return rows[0].id_keranjang;
}

// Isi keranjang + total. Harga yang ditampilkan SELALU harga terbaru dari tabel products.
async function bacaKeranjang(req, idUser) {
  const idKeranjang = await ambilIdKeranjang(db, idUser);
  const [rows] = await db.execute(
    `SELECT d.id_product, p.nama_produk, p.gambar_produk, p.stok, d.jumlah, p.harga_produk AS harga_satuan
     FROM detail_keranjang d JOIN products p ON p.id_product = d.id_product
     WHERE d.id_keranjang = ? ORDER BY d.id_detail_keranjang`,
    [idKeranjang]
  );
  const items = rows.map((r) => ({
    id_product: r.id_product,
    nama_produk: r.nama_produk,
    gambar_url: toUrl(req, r.gambar_produk),
    harga_satuan: r.harga_satuan,
    jumlah: r.jumlah,
    subtotal: Math.round(r.harga_satuan * r.jumlah * 100) / 100,
    stok: r.stok,
    stok_cukup: r.stok >= r.jumlah, // false -> client bisa memberi peringatan sebelum checkout
  }));
  const total_harga = Math.round(items.reduce((t, i) => t + i.subtotal, 0) * 100) / 100;
  return {
    id_keranjang: idKeranjang,
    items,
    total_item: items.reduce((t, i) => t + i.jumlah, 0),
    total_harga,
  };
}

// Menjalankan fn(conn, idKeranjang) di dalam transaksi DB. Baris keranjang dikunci (FOR UPDATE)
// supaya dua request bersamaan dari user yang sama tidak membuat baris ganda.
async function dalamTransaksi(idUser, fn) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const idKeranjang = await ambilIdKeranjang(conn, idUser);
    await conn.execute('SELECT id_keranjang FROM keranjang WHERE id_keranjang = ? FOR UPDATE', [idKeranjang]);
    await fn(conn, idKeranjang);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function ambilProduk(conn, idProduct) {
  const [rows] = await conn.execute('SELECT id_product, nama_produk, harga_produk, stok FROM products WHERE id_product = ?', [
    idProduct,
  ]);
  if (!rows.length) throw new AppError('Produk tidak ditemukan', 404);
  return rows[0];
}

// GET /api/cart
exports.get = asyncHandler(async (req, res) => {
  success(res, await bacaKeranjang(req, req.user.id_user));
});

// POST /api/cart/items  { id_product, jumlah? } -> tambah ke keranjang (jika sudah ada, jumlahnya ditambah)
exports.addItem = asyncHandler(async (req, res) => {
  const idProduct = Number(req.body.id_product);
  const tambah = Number(req.body.jumlah || 1);

  await dalamTransaksi(req.user.id_user, async (conn, idKeranjang) => {
    const p = await ambilProduk(conn, idProduct);
    const [ada] = await conn.execute(
      'SELECT id_detail_keranjang, jumlah FROM detail_keranjang WHERE id_keranjang = ? AND id_product = ?',
      [idKeranjang, idProduct]
    );
    const jumlahBaru = (ada.length ? ada[0].jumlah : 0) + tambah;
    if (jumlahBaru > p.stok) {
      throw new AppError(`Stok ${p.nama_produk} tidak cukup (tersisa ${p.stok}, di keranjang ${ada.length ? ada[0].jumlah : 0})`, 409);
    }
    if (ada.length) {
      await conn.execute('UPDATE detail_keranjang SET jumlah = ?, harga_produk = ? WHERE id_detail_keranjang = ?', [
        jumlahBaru,
        p.harga_produk,
        ada[0].id_detail_keranjang,
      ]);
    } else {
      await conn.execute(
        'INSERT INTO detail_keranjang (id_keranjang, id_product, jumlah, harga_produk) VALUES (?, ?, ?, ?)',
        [idKeranjang, idProduct, jumlahBaru, p.harga_produk]
      );
    }
  });

  success(res, await bacaKeranjang(req, req.user.id_user), 'Produk dimasukkan ke keranjang', 201);
});

// PUT /api/cart/items/:id_product  { jumlah } -> ubah jumlah menjadi nilai tertentu
exports.setQty = asyncHandler(async (req, res) => {
  const idProduct = Number(req.params.id_product);
  const jumlah = Number(req.body.jumlah);

  await dalamTransaksi(req.user.id_user, async (conn, idKeranjang) => {
    const [ada] = await conn.execute(
      'SELECT id_detail_keranjang FROM detail_keranjang WHERE id_keranjang = ? AND id_product = ?',
      [idKeranjang, idProduct]
    );
    if (!ada.length) throw new AppError('Produk tidak ada di keranjang', 404);
    const p = await ambilProduk(conn, idProduct);
    if (jumlah > p.stok) throw new AppError(`Stok ${p.nama_produk} tidak cukup (tersisa ${p.stok})`, 409);
    await conn.execute('UPDATE detail_keranjang SET jumlah = ?, harga_produk = ? WHERE id_detail_keranjang = ?', [
      jumlah,
      p.harga_produk,
      ada[0].id_detail_keranjang,
    ]);
  });

  success(res, await bacaKeranjang(req, req.user.id_user), 'Jumlah diperbarui');
});

// DELETE /api/cart/items/:id_product -> hapus satu produk dari keranjang
exports.removeItem = asyncHandler(async (req, res) => {
  const idKeranjang = await ambilIdKeranjang(db, req.user.id_user);
  const [r] = await db.execute('DELETE FROM detail_keranjang WHERE id_keranjang = ? AND id_product = ?', [
    idKeranjang,
    req.params.id_product,
  ]);
  if (!r.affectedRows) throw new AppError('Produk tidak ada di keranjang', 404);
  success(res, await bacaKeranjang(req, req.user.id_user), 'Produk dihapus dari keranjang');
});

// DELETE /api/cart -> kosongkan keranjang
exports.clear = asyncHandler(async (req, res) => {
  const idKeranjang = await ambilIdKeranjang(db, req.user.id_user);
  await db.execute('DELETE FROM detail_keranjang WHERE id_keranjang = ?', [idKeranjang]);
  success(res, await bacaKeranjang(req, req.user.id_user), 'Keranjang dikosongkan');
});
