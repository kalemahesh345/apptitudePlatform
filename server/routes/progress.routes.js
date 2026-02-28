const router = require('express').Router();
const { getProgress, getPerformanceTrend } = require('../controllers/progress.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getProgress);
router.get('/trends', getPerformanceTrend);

module.exports = router;
