# Rimbun — Toko Pelayanan Pupuk dan Tanaman

Backend REST API (Node.js + Express + MySQL di Aiven). Aplikasi mobile Flutter menyusul di folder `frontend/`.

```
rimbun/
├── backend/            # REST API (Express)
├── database/migrations # 001 = struktur tabel, 002 = data awal
└── frontend/           # Flutter (belum dimulai)
```

## Panduan menghubungkan backend ke Aiven

### 1. Ambil data koneksi dari Aiven
1. Buka Aiven Console, masuk ke service MySQL Anda, pastikan statusnya **Running** (service yang idle bisa dimatikan; nyalakan lagi bila perlu).
2. Di tab **Overview > Connection information** catat: **Host, Port, User, Password**.
3. Di bagian yang sama unduh **CA certificate** (`ca.pem`) dan simpan ke `backend/certs/ca.pem`.
4. Jika ada pengaturan **Allowed IP addresses**, pastikan IP Anda diizinkan (atau biarkan terbuka saat pengembangan).

### 2. Isi file `.env`
```
cd backend
cp .env.example .env     # Windows: copy .env.example .env
```
Isi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` dari Aiven. Biarkan `DB_NAME=rimbun`, `DB_SSL=true`, `DB_SSL_CA=certs/ca.pem`.
Buat `JWT_SECRET`:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
> `.env` berisi rahasia. Jangan di-commit, jangan di-zip untuk dikumpulkan. Kredensial lama yang sempat ikut ter-zip sebaiknya diganti (Aiven Console > service > User > reset password).

### 3. Buat database, tabel, dan data awal
```
npm install
npm run db:migrate      # membuat database "rimbun", semua tabel, dan data kategori/produk
npm run seed:users      # membuat akun admin & pelanggan (password di-hash)
```
`db:migrate` aman dijalankan berulang: file yang sudah jalan dicatat di tabel `schema_migrations` dan dilewati, tabel yang sudah ada tidak dibuat ulang.

### 4. Cek isi database lewat MySQL Workbench
Koneksi baru: isi Host, Port, User, Password dari Aiven. Di tab **SSL** pilih **Use SSL: Require and Verify CA**, lalu pilih file `ca.pem` pada **SSL CA File**. Lalu jalankan:
```sql
USE rimbun;
SHOW TABLES;                                         -- 8 tabel + schema_migrations
SELECT id_user, email, role, LEFT(password,7) FROM users;  -- password harus berawalan $2a$10$
SELECT p.nama_produk, c.nama_category FROM products p JOIN categories c ON p.id_category = c.id_category;
```

### 5. Jalankan dan uji server
```
npm run dev
```
Harus muncul: `Terhubung ke database MySQL (rimbun)` dan `Server Rimbun berjalan di http://localhost:3000`.

| # | Request | Hasil yang benar |
|---|---|---|
| 1 | `GET /api/health` | 200, `database_name: "rimbun"` |
| 2 | `POST /api/auth/login` admin@rimbun.com / admin123 | 200 + `token` |
| 3 | login dengan password salah | 401 |
| 4 | `GET /api/auth/me` tanpa token | 401 |
| 5 | `GET /api/auth/me` + `Authorization: Bearer <token>` | 200 |
| 6 | `POST /api/auth/register` data baru | 201, role `pelanggan` |
| 7 | register email yang sama | 409 |
| 8 | register password < 6 karakter | 422 |

Contoh curl:
```
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@rimbun.com","password":"admin123"}'
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <TOKEN>"
```

### 6. (Opsional) Memindahkan data dari `defaultdb` lama
Seed 002 sudah berisi 3 kategori dan 5 produk yang sama dengan data Anda, jadi biasanya tidak perlu menyalin. Jika ada data lain di `defaultdb`, salin setelah migrate (kategori dulu, baru produk):
```sql
INSERT IGNORE INTO rimbun.categories SELECT * FROM defaultdb.categories;
INSERT IGNORE INTO rimbun.products   SELECT * FROM defaultdb.products;
```
`defaultdb` tidak dihapus, jadi tetap menjadi cadangan.

## Masalah umum

| Pesan error | Penyebab dan solusi |
|---|---|
| `ETIMEDOUT` / `ECONNREFUSED` | Host/port salah, service Aiven mati, atau IP belum diizinkan |
| `ER_ACCESS_DENIED_ERROR` | User/password salah (copy ulang dari Aiven, tanpa spasi) |
| `Connections using insecure transport are prohibited` | `DB_SSL` belum `true` |
| `self-signed certificate in certificate chain` | Pakai `DB_SSL_CA=certs/ca.pem`, atau sementara kosongkan `DB_SSL_CA` |
| `File CA tidak ditemukan` | `ca.pem` belum disimpan di `backend/certs/` |
| `ER_BAD_DB_ERROR` | Belum menjalankan `npm run db:migrate` |
| `JWT_SECRET belum diset` | Isi `JWT_SECRET` di `.env` |

## Endpoint saat ini
| Method | Path | Akses |
|---|---|---|
| GET | `/` , `/api/health` | publik |
| POST | `/api/auth/register` | publik (role otomatis pelanggan) |
| POST | `/api/auth/login` | publik |
| GET | `/api/auth/me` | login |

Format response: sukses `{ success, message, data }`; gagal `{ success, message, errors? }`.
