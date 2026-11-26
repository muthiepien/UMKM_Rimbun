# Rimbun Backend (Node.js + Express + MySQL)

## Menjalankan
1. Tabel sudah dibuat manual di database `defaultdb` (file `../database/migrations/001_*.sql`; data awal `002_*.sql`).
2. Salin `.env.example` ke `.env`, isi kredensial Aiven (`DB_NAME=defaultdb`) dan `JWT_SECRET`.
3. `npm install`
4. `npm run seed:users`  -> membuat akun uji: `admin@rimbun.com / admin123` dan `pelanggan@rimbun.com / pelanggan123`
5. `npm run dev` (atau `npm start`), lalu buka `http://localhost:3000/api/health`

## Alur belanja (tanpa payment gateway)
```
Pelanggan                                   Admin
 POST /api/cart/items  (tambah, ulangi)
 GET  /api/cart        (lihat total)
 POST /api/transactions {metode_pembayaran}  -> checkout: keranjang -> transaksi, stok berkurang,
                                                keranjang kosong, pembayaran = belum_bayar
 (tunai)    bayar di toko saat ambil ───────────────────────────►  PATCH /:id/payment {berhasil}
 (transfer/qris) transfer manual, lalu
 PATCH /api/transactions/:id/payment/confirm -> menunggu_verifikasi
                                              ─────────────────►  PATCH /:id/payment {berhasil | ditolak}
                                                                   PATCH /:id/status: diproses -> siap_diambil -> selesai
 PATCH /api/transactions/:id/cancel (selama menunggu_konfirmasi & belum bayar) -> stok kembali
```
Aturan: status `selesai` hanya bisa jika pembayaran `berhasil`. Harga selalu dibaca dari database.

## Endpoint
| Method | Path | Akses |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | publik |
| GET | /api/auth/me | login |
| GET | /api/categories, /api/categories/:id | publik |
| POST/PUT/DELETE | /api/categories(/:id) | admin |
| GET | /api/products(?q=&id_category=&jenis=), /api/products/:id | publik |
| POST/PUT/DELETE | /api/products(/:id) (multipart, field `gambar`) | admin |
| GET | /api/cart | pelanggan |
| POST | /api/cart/items `{id_product, jumlah}` | pelanggan |
| PUT | /api/cart/items/:id_product `{jumlah}` | pelanggan |
| DELETE | /api/cart/items/:id_product, /api/cart | pelanggan |
| POST | /api/transactions `{metode_pembayaran}` (checkout) | pelanggan |
| GET | /api/transactions(?status=), /api/transactions/:id | login (pelanggan: miliknya, admin: semua) |
| PATCH | /api/transactions/:id/cancel | pelanggan |
| PATCH | /api/transactions/:id/payment/confirm | pelanggan |
| PATCH | /api/transactions/:id/status `{status}` | admin |
| PATCH | /api/transactions/:id/payment `{status_pembayaran}` | admin |

Format response: `{ success, message, data }` atau `{ success:false, message, errors? }`.
ERD: lihat `../docs/ERD.md`.
