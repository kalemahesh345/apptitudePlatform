const Test = require('../models/test.model');
const Attempt = require('../models/attempt.model');
const Question = require('../models/question.model');

// Get all available tests
const getTests = async (req, res, next) => {
  try {
    const { category, difficulty } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    
    // Non-premium users can't see premium tests
    if (req.user.role !== 'PREMIUM' && req.user.role !== 'ADMIN') {
      filters.is_premium = false;
    }

    const tests = await Test.findAll(filters);
    res.json({ tests });
  } catch (error) {
    next(error);
  }
};

// Get single test details
const getTestById = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.json({ test });
  } catch (error) {
    next(error);
  }
};

// Start a test attempt
const startTest = async (req, res, next) => {
  try {
    const testId = req.params.id;
    const userId = req.user.id;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check premium restriction
    if (test.is_premium && req.user.role !== 'PREMIUM' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'This test requires a premium subscription.' });
    }

    // Check daily limit for non-premium users (5/day)
    if (req.user.role === 'USER') {
      const dailyCount = await Attempt.getDailyAttemptCount(userId);
      if (dailyCount >= 5) {
        return res.status(429).json({ message: 'Daily test limit reached. Upgrade to Premium for unlimited tests.' });
      }
    }

    // Check for existing in-progress attempt
    let attempt = await Attempt.findInProgress(userId, testId);
    if (attempt) {
      const questions = await Test.getQuestionsForTest(testId);
      return res.json({ attempt, questions, resumed: true });
    }

    // Create new attempt
    const attemptId = await Attempt.create(userId, testId);
    attempt = await Attempt.findById(attemptId);
    const questions = await Test.getQuestionsForTest(testId);

    res.status(201).json({ attempt, questions, resumed: false });
  } catch (error) {
    next(error);
  }
};

// Save an answer during test
const saveAnswer = async (req, res, next) => {
  try {
    const { attemptId, questionId, optionId, timeSpent } = req.body;

    // Verify attempt belongs to user
    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Test already completed' });
    }

    // Check if answer is correct
    const correctOption = await Question.getCorrectOption(questionId);
    const isCorrect = correctOption && correctOption.id === optionId;

    await Attempt.saveAnswer(attemptId, questionId, optionId, isCorrect, timeSpent || 0);

    res.json({ saved: true, isCorrect });
  } catch (error) {
    next(error);
  }
};

// Submit test
const submitTest = async (req, res, next) => {
  try {
    const attemptId = req.params.attemptId;
    const { timeTaken } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (attempt.status === 'completed') {
      return res.status(400).json({ message: 'Test already submitted' });
    }

    // Calculate results  
    const answers = await Attempt.getAnswers(attemptId);
    const questions = await Question.findByTestId(attempt.test_id);

    let correct = 0, incorrect = 0, totalMarks = 0, score = 0;

    questions.forEach(q => {
      totalMarks += q.marks;
      const answer = answers.find(a => a.question_id === q.id);
      if (answer && answer.selected_option_id) {
        if (answer.is_correct) {
          correct++;
          score += q.marks;
        } else {
          incorrect++;
          score -= q.negative_marks || 0;
        }
      }
    });

    const unanswered = questions.length - correct - incorrect;
    const accuracy = questions.length > 0 ? ((correct / questions.length) * 100) : 0;

    await Attempt.complete(attemptId, {
      time_taken: timeTaken || 0,
      score: Math.max(0, score),
      total_marks: totalMarks,
      correct,
      incorrect,
      unanswered,
      accuracy: accuracy.toFixed(2)
    });

    // Update progress
    await updateUserProgress(req.user.id, answers, questions);

    const result = await Attempt.findById(attemptId);
    res.json({ message: 'Test submitted successfully', result });
  } catch (error) {
    next(error);
  }
};

// Helper: Update user progress after test
const updateUserProgress = async (userId, answers, questions) => {
  const pool = require('../config/db');
  const topicStats = {};

  answers.forEach(a => {
    const q = questions.find(q => q.id === a.question_id);
    if (!q) return;
    const topic = q.topic || 'General';
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, correct: 0, totalTime: 0, category: q.category || 'quantitative' };
    }
    topicStats[topic].total++;
    if (a.is_correct) topicStats[topic].correct++;
    topicStats[topic].totalTime += a.time_spent_seconds || 0;
  });

  for (const [topic, stats] of Object.entries(topicStats)) {
    const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100) : 0;
    const avgTime = stats.total > 0 ? (stats.totalTime / stats.total) : 0;
    let skillLevel = 'beginner';
    if (accuracy >= 90) skillLevel = 'expert';
    else if (accuracy >= 70) skillLevel = 'advanced';
    else if (accuracy >= 50) skillLevel = 'intermediate';

    // Check if progress exists for this user+topic
    const [existing] = await pool.query(
      'SELECT id, tests_taken, total_questions, correct_answers FROM progress WHERE user_id = ? AND topic = ?',
      [userId, topic]
    );

    if (existing.length > 0) {
      const e = existing[0];
      const newTotal = e.total_questions + stats.total;
      const newCorrect = e.correct_answers + stats.correct;
      const newAccuracy = newTotal > 0 ? (newCorrect / newTotal * 100) : 0;
      await pool.query(
        'UPDATE progress SET tests_taken = ?, total_questions = ?, correct_answers = ?, accuracy = ?, avg_time_per_question = ?, skill_level = ? WHERE id = ?',
        [e.tests_taken + 1, newTotal, newCorrect, newAccuracy, avgTime, skillLevel, e.id]
      );
    } else {
      await pool.query(
        'INSERT INTO progress (user_id, topic, category, tests_taken, total_questions, correct_answers, accuracy, avg_time_per_question, skill_level) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)',
        [userId, topic, stats.category, stats.total, stats.correct, accuracy, avgTime, skillLevel]
      );
    }
  }
};

module.exports = { getTests, getTestById, startTest, saveAnswer, submitTest };
