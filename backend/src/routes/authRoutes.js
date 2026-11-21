const router = require('express').Router();
const ctrl = require('../controllers/authController');
const v = require('../validators/authValidator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

router.post('/register', v.register, validate, ctrl.register);
router.post('/login', v.login, validate, ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
