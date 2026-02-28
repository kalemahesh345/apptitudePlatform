const router = require('express').Router();
const { getResults, getResultById, getDashboardStats } = require('../controllers/result.controller');
const { getLeaderboard } = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/leaderboard', getLeaderboard);
router.get('/', getResults);
router.get('/:id', getResultById);

module.exports = router;
