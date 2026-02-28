const router = require('express').Router();
const { getTests, getTestById, startTest, saveAnswer, submitTest } = require('../controllers/test.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getTests);
router.get('/:id', getTestById);
router.post('/:id/start', startTest);
router.post('/answer', saveAnswer);
router.post('/:attemptId/submit', submitTest);

module.exports = router;
