const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const v = require('../validators/categoryValidator');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

// Publik: siapa pun boleh melihat
router.get('/', v.filter, validate, ctrl.list);
router.get('/:id', v.id, validate, ctrl.detail);

// Khusus admin: harus login (authenticate) lalu dicek role-nya (authorize)
router.post('/', authenticate, authorize('admin'), v.payload, validate, ctrl.create);
router.put('/:id', authenticate, authorize('admin'), v.id, v.payload, validate, ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), v.id, validate, ctrl.remove);

module.exports = router;
