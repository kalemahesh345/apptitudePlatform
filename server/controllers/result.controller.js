const Attempt = require('../models/attempt.model');

// Get all results for current user
const getResults = async (req, res, next) => {
  try {
    const results = await Attempt.findByUser(req.user.id, 50);
    const completed = results.filter(r => r.status === 'completed');
    res.json({ results: completed });
  } catch (error) {
    next(error);
  }
};

// Get single result with detailed answers
const getResultById = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Users can only see their own results, admins can see all
    if (attempt.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const answers = await Attempt.getAnswers(req.params.id);
    
    // Get all options for each question for display
    const pool = require('../config/db');
    for (let ans of answers) {
      const [options] = await pool.query(
        'SELECT id, option_text, is_correct FROM options WHERE question_id = ?',
        [ans.question_id]
      );
      ans.all_options = options;
    }

    res.json({ result: attempt, answers });
  } catch (error) {
    next(error);
  }
};

// Get user dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await Attempt.getUserStats(req.user.id);
    const recentScores = await Attempt.getRecentScores(req.user.id);
    const topicStats = await Attempt.getTopicWiseStats(req.user.id);

    // Identify strong and weak subjects
    const strongTopics = topicStats.filter(t => t.accuracy >= 70).map(t => t.topic);
    const weakTopics = topicStats.filter(t => t.accuracy < 50).map(t => t.topic);

    res.json({
      stats: {
        totalTests: stats.total_tests || 0,
        avgAccuracy: parseFloat(stats.avg_accuracy || 0).toFixed(1),
        avgScore: parseFloat(stats.avg_score || 0).toFixed(1),
        totalCorrect: stats.total_correct || 0,
        totalIncorrect: stats.total_incorrect || 0,
        bestScore: stats.best_score || 0
      },
      recentScores,
      topicStats,
      strongTopics,
      weakTopics
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getResults, getResultById, getDashboardStats };
