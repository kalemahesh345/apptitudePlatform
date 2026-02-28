const router = require('express').Router();
const { analyzeResults, getRecommendations, explainQuestion, chat, getChatHistory } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/analyze', analyzeResults);
router.post('/recommend', getRecommendations);
router.post('/explain', explainQuestion);
router.post('/chat', chat);
router.get('/chat/history', getChatHistory);

module.exports = router;
