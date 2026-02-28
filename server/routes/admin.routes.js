const router = require('express').Router();
const multer = require('multer');
const {
  getDashboardStats, getUsers, updateUserRole,
  createQuestion, updateQuestion, deleteQuestion, bulkUploadQuestions,
  createTest, updateTest, deleteTest,
  getAllResults, getLeaderboard, getQuestionStats,
  generateResultPDF
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

// Tests
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

// Questions
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/upload', upload.single('file'), bulkUploadQuestions);

// Results & Leaderboard
router.get('/results', getAllResults);
router.get('/results/:id/pdf', generateResultPDF);
router.get('/leaderboard', getLeaderboard);
router.get('/question-stats', getQuestionStats);

module.exports = router;
