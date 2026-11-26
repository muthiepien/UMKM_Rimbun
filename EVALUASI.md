# Evaluasi & Revisi Project Rimbun (Backend)

## 1. Kesesuaian dengan ketentuan tugas

| Ketentuan | Status | Catatan |
|---|---|---|
| Node.js + Express, REST API | Sesuai | Struktur rapi: routes → validators → controllers, middleware terpisah |
| MySQL | Sesuai | Pool koneksi + SSL Aiven, database `defaultdb` |
| CRUD ≥ 2 data berhubungan | Sesuai | categories ↔ products (CRUD penuh), plus transaksi |
| Register/login, password hash | Sesuai | bcrypt, JWT |
| Role ≥ 2 + middleware | Sesuai | `admin`, `pelanggan`; `authenticate` + `authorize` |
| Upload gambar + validasi tipe/ukuran | Sesuai | JPG/PNG/WEBP, maks 2 MB, file dihapus bila request gagal |
| Validasi input & error handling | Sesuai | express-validator (422), errorHandler terpusat |
| HTTP method & status code | Sesuai | 201/400/401/403/404/409/413/422 dipakai tepat |
| Data dari database | Sesuai | |
| PK/FK, SQL migration | Sesuai | `database/migrations/001`, `002` |
| **ERD** | **Belum ada** → dibuat | `docs/ERD.md` (Mermaid, bisa diekspor jadi gambar) |
| Akun uji tiap role | Ada | `npm run seed:users` (harus dijalankan sekali) |
| Aplikasi Flutter | **Belum ada** | `lib/main.dart` kosong (0 byte); di luar fokus saat ini |

## 2. Masalah proses yang ditemukan (backend)

1. **Keranjang tidak punya API.** Tabel `keranjang` & `detail_keranjang` sudah ada di DB tetapi tidak dipakai; checkout lama menerima daftar `items` dari body. Sekarang: modul `/api/cart` + checkout membaca keranjang.
2. **Tabel `pembayaran` tidak pernah diisi.** Transaksi dibuat tanpa catatan pembayaran. Sekarang checkout otomatis membuat baris pembayaran.
3. **`npm run db:migrate` mengarah ke `scripts/migrate.js` yang tidak ada** → dihapus dari `package.json` (migrasi Anda jalankan manual di `defaultdb`).
4. **Komentar migrasi usang** (menyebut migrate.js) → diperbarui.
5. **Menghapus produk yang ada di keranjang** akan ditolak FK. Sekarang produk dikeluarkan dari keranjang lebih dulu; produk yang sudah pernah dibeli tetap ditolak 409 (riwayat terjaga).
6. **Versi tidak konsisten** (`package.json` 0.2.0 vs API 0.5.0) → diseragamkan 0.6.0.

## 3. Keamanan: tindak lanjut untuk Anda
- File `.env` di dalam zip berisi **password database Aiven dan JWT_SECRET asli**. Karena sudah terkirim, sebaiknya **ganti password Aiven dan buat JWT_SECRET baru**. (`.gitignore` sudah benar mengabaikan `.env`; pastikan tidak pernah ter-commit.)
- Upload divalidasi dari header `Content-Type`, bukan isi file. Cukup untuk tugas ini.
- Akun uji (`admin123`) hanya untuk pengujian; jangan dipakai di produksi.

## 4. Folder/file yang tidak berfungsi atau tidak relevan

| Item | Penilaian | Tindakan |
|---|---|---|
| `backend/src/config/dbConfig.js` | Dulu dipisah untuk `migrate.js` yang tidak ada | **Dihapus**, digabung ke `db.js` |
| `frontend/lib/main.dart` | Kosong → aplikasi tidak bisa dikompilasi | Isi nanti (fase frontend) |
| `frontend/test/widget_test.dart` | Tes bawaan counter app, akan gagal | Hapus/ganti saat frontend dikerjakan |
| `frontend/linux/`, `windows/`, `macos/`, `web/` | Tugas mewajibkan **mobile** (Android/iOS) | Aman dihapus |
| `frontend/.idea/`, `.dart_tool/`, `*.iml`, `android/local.properties` | File IDE/generate lokal (berisi path SDK komputer Anda) | Jangan disertakan saat dikumpulkan |
| `frontend/README.md` | Boilerplate Flutter | Ganti dengan README project |
| `Rimbun/.gitkeep` | Tidak berguna (folder sudah berisi file) | Boleh dihapus |
| `backend/node_modules/` di zip | Besar, bisa dibuat ulang | Jangan disertakan; `npm install` |
| `backend/certs/ca.pem` | **Dipakai** (SSL Aiven) | Pertahankan; di-ignore git, jadi unduh ulang di komputer lain |
| `backend/uploads/produk/` | **Dipakai** (gambar upload) | Pertahankan |
| `scripts/seedUsers.js`, `002_seed_*.sql` | **Dipakai** | Pertahankan |

## 5. Keranjang & checkout tanpa payment gateway
Konsepnya: pembayaran **dicatat dan diverifikasi manual oleh admin**, bukan otomatis oleh pihak ketiga.

1. Pelanggan menambah produk: `POST /api/cart/items`. Stok dicek; harga selalu dari tabel produk.
2. Checkout: `POST /api/transactions {"metode_pembayaran":"tunai|transfer|qris"}`. Dalam satu transaksi DB: keranjang dibaca → stok dikunci & dicek → header + detail transaksi dibuat → stok dikurangi → baris `pembayaran` (`belum_bayar`) dibuat → keranjang dikosongkan. Gagal di mana pun = semua dibatalkan (keranjang tetap utuh).
3. Bayar:
   - **Tunai**: bayar di toko saat ambil barang; admin menandai `berhasil`.
   - **Transfer/QRIS**: pelanggan transfer manual ke rekening/QR toko, lalu `PATCH /:id/payment/confirm` ("saya sudah bayar" → `menunggu_verifikasi`); admin cek mutasi lalu `PATCH /:id/payment` `berhasil` atau `ditolak` (pelanggan boleh konfirmasi ulang).
4. Admin memproses pesanan: `diproses → siap_diambil → selesai`. `selesai` ditolak (409) bila pembayaran belum `berhasil`.
5. Pembatalan: pelanggan boleh selama `menunggu_konfirmasi` dan pembayaran belum dikirim; stok dikembalikan.

Tidak ada perubahan struktur tabel; semua memakai kolom yang sudah Anda buat. Opsi lanjutan: upload bukti transfer (perlu kolom `bukti_pembayaran` di `pembayaran`) dan menampilkan nomor rekening toko lewat endpoint info.

## 6. Pengujian
- Sintaks seluruh file JS diperiksa (`node --check`).
- 40 skenario uji (auth/role, keranjang, stok, checkout, pembayaran, pembatalan, hapus produk) **lulus**, tetapi dijalankan di **SQLite in-memory sebagai pengganti MySQL**, karena database Aiven tidak dapat dijangkau dari lingkungan saya. Kueri memakai SQL standar sehingga seharusnya identik di MySQL, tetapi **belum diuji langsung ke `defaultdb`**. Langkah verifikasi di komputer Anda: lihat bagian "Menjalankan" di `backend/README.md`, lalu cek `/api/health` dan jalankan alur belanja di atas dengan Postman.
