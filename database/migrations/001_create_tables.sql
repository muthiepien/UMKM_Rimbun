-- Rimbun - Toko Pelayanan Pupuk dan Tanaman
-- Migration 001: struktur tabel (DDL). Aman dijalankan berulang (IF NOT EXISTS).
-- Dijalankan MANUAL (MySQL Workbench / Aiven console) pada database `defaultdb`, yaitu DB_NAME di .env.

CREATE TABLE IF NOT EXISTS users (
    id_user INT NOT NULL AUTO_INCREMENT,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    no_telepon VARCHAR(20),
    role ENUM('admin', 'pelanggan') NOT NULL DEFAULT 'pelanggan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_user)
);

CREATE TABLE IF NOT EXISTS categories (
    id_category INT NOT NULL AUTO_INCREMENT,
    nama_category VARCHAR(100) NOT NULL,
    jenis_category ENUM('tanaman', 'pupuk') NOT NULL,
    deskripsi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_category)
);

CREATE TABLE IF NOT EXISTS products (
    id_product INT NOT NULL AUTO_INCREMENT,
    id_category INT NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    jenis_produk VARCHAR(100),
    deskripsi_produk TEXT,
    harga_produk DECIMAL(12,2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    gambar_produk VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_product),
    FOREIGN KEY (id_category) REFERENCES categories(id_category)
);

CREATE TABLE IF NOT EXISTS keranjang (
    id_keranjang INT NOT NULL AUTO_INCREMENT,
    id_user INT NOT NULL UNIQUE,
    tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_keranjang),
    FOREIGN KEY (id_user) REFERENCES users(id_user)
);

CREATE TABLE IF NOT EXISTS detail_keranjang (
    id_detail_keranjang INT NOT NULL AUTO_INCREMENT,
    id_keranjang INT NOT NULL,
    id_product INT NOT NULL,
    jumlah INT NOT NULL DEFAULT 1,
    harga_produk DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id_detail_keranjang),
    FOREIGN KEY (id_keranjang) REFERENCES keranjang(id_keranjang),
    FOREIGN KEY (id_product) REFERENCES products(id_product)
);

CREATE TABLE IF NOT EXISTS header_transaksi (
    id_transaksi INT NOT NULL AUTO_INCREMENT,
    id_user INT NOT NULL,
    tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_harga DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status_transaksi ENUM('menunggu_konfirmasi','diproses','siap_diambil','selesai','dibatalkan')
        NOT NULL DEFAULT 'menunggu_konfirmasi',
    PRIMARY KEY (id_transaksi),
    FOREIGN KEY (id_user) REFERENCES users(id_user)
);

CREATE TABLE IF NOT EXISTS detail_transaksi (
    id_detail_transaksi INT NOT NULL AUTO_INCREMENT,
    id_transaksi INT NOT NULL,
    id_product INT NOT NULL,
    jumlah INT NOT NULL,
    harga_satuan DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id_detail_transaksi),
    FOREIGN KEY (id_transaksi) REFERENCES header_transaksi(id_transaksi),
    FOREIGN KEY (id_product) REFERENCES products(id_product)
);

CREATE TABLE IF NOT EXISTS pembayaran (
    id_pembayaran INT NOT NULL AUTO_INCREMENT,
    id_transaksi INT NOT NULL UNIQUE,
    metode_pembayaran ENUM('tunai','transfer','qris') NOT NULL DEFAULT 'tunai',
    jumlah_pembayaran DECIMAL(12,2) NOT NULL,
    tanggal_pembayaran TIMESTAMP NULL DEFAULT NULL,
    status_pembayaran ENUM('belum_bayar','menunggu_verifikasi','berhasil','ditolak')
        NOT NULL DEFAULT 'belum_bayar',
    PRIMARY KEY (id_pembayaran),
    FOREIGN KEY (id_transaksi) REFERENCES header_transaksi(id_transaksi)
);
