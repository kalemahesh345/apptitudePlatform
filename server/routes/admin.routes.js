const router = require('express').Router();
const multer = require('multer');
const {
  getDashboardStats, getUsers, updateUserRole, deleteUser,
  createQuestion, updateQuestion, deleteQuestion, bulkUploadQuestions,
  createTest, updateTest, deleteTest,
  getAllResults, getLeaderboard, getQuestionStats,
  generateResultPDF, downloadTemplate
} = require('../controllers/admin.controller');
const { createMaterial, updateMaterial, deleteMaterial } = require('../controllers/study.controller');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Tests
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

// Questions
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/upload', upload.single('file'), bulkUploadQuestions);
router.get('/questions/template', downloadTemplate);

// Results & Leaderboard
router.get('/results', getAllResults);
router.get('/results/:id/pdf', generateResultPDF);
router.get('/leaderboard', getLeaderboard);
router.get('/question-stats', getQuestionStats);

// Study Materials
router.post('/study-materials', createMaterial);
router.put('/study-materials/:id', updateMaterial);
router.delete('/study-materials/:id', deleteMaterial);

module.exports = router;
