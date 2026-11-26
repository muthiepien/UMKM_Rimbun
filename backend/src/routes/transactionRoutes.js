const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
const v = require('../validators/transactionValidator');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

// Semua route transaksi bersifat privat: harus login.
router.use(authenticate);

router.post('/', authorize('pelanggan'), v.create, validate, ctrl.create);           // checkout dari keranjang
router.get('/', v.filter, validate, ctrl.list);                                       // pelanggan: miliknya, admin: semua
router.get('/:id', v.id, validate, ctrl.detail);
router.patch('/:id/cancel', authorize('pelanggan'), v.id, validate, ctrl.cancel);     // batalkan pesanan sendiri
router.patch('/:id/status', authorize('admin'), v.id, v.status, validate, ctrl.updateStatus);

// Pembayaran manual (tanpa payment gateway)
router.patch('/:id/payment/confirm', authorize('pelanggan'), v.id, validate, ctrl.confirmPayment); // "saya sudah bayar"
router.patch('/:id/payment', authorize('admin'), v.id, v.paymentVerify, validate, ctrl.verifyPayment); // terima/tolak

module.exports = router;
