-- Migration 002: data awal kategori dan produk (DML). Aman dijalankan berulang:
-- baris yang sudah ada (berdasarkan nama) tidak ditambahkan lagi.
-- Catatan: deskripsi kategori di bawah ini ditulis ulang; sesuaikan jika data asli Anda berbeda.

INSERT INTO categories (nama_category, jenis_category, deskripsi)
SELECT s.nama_category, s.jenis_category, s.deskripsi
FROM (
    SELECT 'Pupuk Anorganik' AS nama_category, 'pupuk' AS jenis_category, 'Pupuk kimia sintetis dengan kandungan unsur hara terukur.' AS deskripsi
    UNION ALL
    SELECT 'Pupuk Hayati', 'pupuk', 'Pupuk berbahan mikroorganisme yang membantu kesuburan tanah.'
    UNION ALL
    SELECT 'Tanaman Buah', 'tanaman', 'Bibit tanaman buah untuk pekarangan dan kebun.'
) AS s
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.nama_category = s.nama_category);

INSERT INTO products
(id_category, nama_produk, jenis_produk, deskripsi_produk, harga_produk, stok, gambar_produk)
SELECT c.id_category, p.nama_produk, p.jenis_produk, p.deskripsi_produk, p.harga_produk, p.stok, p.gambar_produk
FROM (
    SELECT 'Pupuk Anorganik' AS nama_category, 'Pupuk Urea' AS nama_produk, 'Pupuk Anorganik' AS jenis_produk,
           'Pupuk nitrogen untuk membantu pertumbuhan vegetatif tanaman.' AS deskripsi_produk,
           30000 AS harga_produk, 35 AS stok,
           'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80' AS gambar_produk
    UNION ALL
    SELECT 'Pupuk Hayati', 'Pupuk Biofertilizer', 'Pupuk Hayati',
           'Pupuk yang mengandung mikroorganisme bermanfaat untuk membantu ketersediaan unsur hara.', 40000, 30,
           'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=800&q=80'
    UNION ALL
    SELECT 'Pupuk Hayati', 'Pupuk Mikoriza', 'Pupuk Hayati',
           'Pupuk yang mengandung jamur mikoriza untuk membantu penyerapan nutrisi oleh akar tanaman.', 45000, 25,
           'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80'
    UNION ALL
    SELECT 'Tanaman Buah', 'Bibit Jeruk', 'Tanaman Buah',
           'Bibit tanaman jeruk untuk dibudidayakan di pekarangan rumah maupun kebun.', 35000, 20,
           'https://images.unsplash.com/photo-1591080298367-7c1c8e4f7c6e?auto=format&fit=crop&w=800&q=80'
    UNION ALL
    SELECT 'Tanaman Buah', 'Bibit Stroberi', 'Tanaman Buah',
           'Bibit stroberi yang cocok ditanam menggunakan pot maupun media tanam di kebun.', 25000, 25,
           'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80'
) AS p
JOIN categories c ON c.nama_category = p.nama_category
WHERE NOT EXISTS (SELECT 1 FROM products e WHERE e.nama_produk = p.nama_produk);
