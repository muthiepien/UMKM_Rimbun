# Progres Backend Rimbun

**Status: tahap 1 dari 5.** Fondasi server, autentikasi, dan database sudah ditulis; pengujian ke Aiven belum dijalankan.

## Struktur
```
backend/
├── scripts/        migrate.js (jalankan SQL migration), seedUsers.js (akun uji per role)
├── uploads/produk/ tempat gambar produk (dipakai tahap 3)
├── certs/          ca.pem dari Aiven (tidak di-commit)
└── src/
    ├── server.js · app.js
    ├── config/      dbConfig.js (SSL Aiven), db.js (pool MySQL)
    ├── routes/ · controllers/ · validators/
    ├── middlewares/ auth.js (authenticate, authorize), validate.js, errorHandler.js
    └── utils/       AppError, asyncHandler, response
database/migrations/ 001_create_tables.sql, 002_seed_categories_products.sql
```
Alur request: Client → app.js → route → validator → validate.js → controller → MySQL → response.js (error → errorHandler.js).

## Checklist
- [x] Setup proyek, koneksi database (SSL Aiven), format response, error handler
- [x] Skema 8 tabel + migration + seed data
- [x] Register, login (JWT), profil user, health check
- [x] Middleware autentikasi dan otorisasi role (`authorize` belum dipakai)
- [x] Seed akun uji admin & pelanggan
- [x] Uji tahap 1 ke Aiven (lihat README bagian 5)
- [x] Tahap 2: CRUD kategori (tulis: admin saja)
- [x] Tahap 3: CRUD produk + upload gambar (multer, validasi tipe/ukuran) + cari/filter
- [ ] Tahap 4: transaksi + detail transaksi (DB transaction, cek stok), status oleh admin
- [ ] Tahap 5: ERD, dokumentasi endpoint, aplikasi Flutter
