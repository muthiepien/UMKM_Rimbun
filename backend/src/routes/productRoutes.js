const router = require('express').Router();
const ctrl = require('../controllers/productController');
const v = require('../validators/productValidator');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadGambar } = require('../middlewares/upload');

// Publik
router.get('/', v.filter, validate, ctrl.list);
router.get('/:id', v.id, validate, ctrl.detail);

// Admin. URUTAN PENTING: login -> role -> upload (membaca form-data) -> validasi -> controller
router.post('/', authenticate, authorize('admin'), uploadGambar, v.payload, validate, ctrl.create);
router.put('/:id', authenticate, authorize('admin'), uploadGambar, v.id, v.payload, validate, ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), v.id, validate, ctrl.remove);

module.exports = router;
