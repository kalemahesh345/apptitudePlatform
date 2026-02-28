const router = require('express').Router();
const { getMaterials, getMaterialById, getTopics } = require('../controllers/study.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/topics', getTopics);
router.get('/', getMaterials);
router.get('/:id', getMaterialById);

module.exports = router;
