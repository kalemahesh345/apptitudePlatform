const router = require('express').Router();
const { getSubscription, subscribe } = require('../controllers/premium.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/status', getSubscription);
router.post('/subscribe', subscribe);

module.exports = router;
