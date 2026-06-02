const router = require('express').Router();
const { register, login, refresh, logout, getMe, setupAdmin, registerValidation, loginValidation } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/setup-admin', setupAdmin);

module.exports = router;
