const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

// POST /api/auth/register  -> selalu membuat akun role "pelanggan".
// Role admin tidak boleh dipilih dari request (mencegah privilege escalation).
exports.register = asyncHandler(async (req, res) => {
  const { nama, email, password, no_telepon = null } = req.body;

  const [exist] = await db.execute('SELECT id_user FROM users WHERE email = ?', [email]);
  if (exist.length) throw new AppError('Email sudah terdaftar', 409);

  const hash = await bcrypt.hash(password, 10); // password disimpan sebagai hash
  const [result] = await db.execute(
    "INSERT INTO users (nama, email, password, role, no_telepon) VALUES (?, ?, ?, 'pelanggan', ?)",
    [nama, email, hash, no_telepon]
  );

  success(res, { id_user: result.insertId, nama, email, role: 'pelanggan', no_telepon }, 'Registrasi berhasil', 201);
});

// POST /api/auth/login -> mengembalikan JWT
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  // Pesan sengaja sama untuk email salah / password salah agar tidak membocorkan email yang terdaftar.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Email atau password salah', 401);
  }

  const token = jwt.sign({ id_user: user.id_user, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  success(
    res,
    {
      token,
      user: { id_user: user.id_user, nama: user.nama, email: user.email, role: user.role, no_telepon: user.no_telepon },
    },
    'Login berhasil'
  );
});

// GET /api/auth/me -> profil user yang sedang login
exports.me = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(
    'SELECT id_user, nama, email, role, no_telepon, created_at FROM users WHERE id_user = ?',
    [req.user.id_user]
  );
  if (!rows.length) throw new AppError('User tidak ditemukan', 404);
  success(res, rows[0]);
});
