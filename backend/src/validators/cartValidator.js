const { body, param } = require('express-validator');

const idProduct = [param('id_product').isInt({ min: 1 }).withMessage('id_product harus angka positif')];

// POST /api/cart/items
const add = [
  body('id_product').isInt({ min: 1 }).withMessage('id_product harus angka positif'),
  body('jumlah').optional().isInt({ min: 1, max: 1000 }).withMessage('jumlah harus angka 1-1000'),
];

// PUT /api/cart/items/:id_product  (jumlah = jumlah akhir, bukan tambahan)
const setQty = [
  ...idProduct,
  body('jumlah').isInt({ min: 1, max: 1000 }).withMessage('jumlah harus angka 1-1000'),
];

module.exports = { idProduct, add, setQty };
