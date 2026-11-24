const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
const v = require('../validators/transactionValidator');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

// Semua route transaksi bersifat privat: harus login.
router.use(authenticate);

router.post('/', authorize('pelanggan'), v.create, validate, ctrl.create);          // checkout
router.get('/', v.filter, validate, ctrl.list);                                      // pelanggan: miliknya, admin: semua
router.get('/:id', v.id, validate, ctrl.detail);
router.patch('/:id/cancel', authorize('pelanggan'), v.id, validate, ctrl.cancel);    // batalkan pesanan sendiri
router.patch('/:id/status', authorize('admin'), v.id, v.status, validate, ctrl.updateStatus);

module.exports = router;
