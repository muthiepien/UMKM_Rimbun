const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const v = require('../validators/cartValidator');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

// Keranjang hanya untuk pelanggan yang login.
router.use(authenticate, authorize('pelanggan'));

router.get('/', ctrl.get);
router.post('/items', v.add, validate, ctrl.addItem);
router.put('/items/:id_product', v.setQty, validate, ctrl.setQty);
router.delete('/items/:id_product', v.idProduct, validate, ctrl.removeItem);
router.delete('/', ctrl.clear);

module.exports = router;
