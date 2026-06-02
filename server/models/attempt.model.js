const pool = require('../config/db');

const Attempt = {
  async create(userId, testId) {
    const [result] = await pool.query(
      'INSERT INTO test_attempts (user_id, test_id) VALUES (?, ?)',
      [userId, testId]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT ta.*, t.title as test_title, t.category, t.difficulty, t.duration_minutes, t.total_marks as test_total_marks
      FROM test_attempts ta 
      JOIN tests t ON ta.test_id = t.id 
      WHERE ta.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByUser(userId, limit = 20) {
    const [rows] = await pool.query(`
      SELECT ta.*, t.title as test_title, t.category, t.difficulty 
      FROM test_attempts ta 
      JOIN tests t ON ta.test_id = t.id 
      WHERE ta.user_id = ? 
      ORDER BY ta.started_at DESC 
      LIMIT ?
    `, [userId, limit]);
    return rows;
  },

  async findInProgress(userId, testId) {
    const [rows] = await pool.query(
      'SELECT * FROM test_attempts WHERE user_id = ? AND test_id = ? AND status = "in_progress"',
      [userId, testId]
    );
    return rows[0] || null;
  },

  async saveAnswer(attemptId, questionId, optionId, isCorrect, timeSpent) {
    // Upsert answer
    const [existing] = await pool.query(
      'SELECT id FROM user_answers WHERE attempt_id = ? AND question_id = ?',
      [attemptId, questionId]
    );
    
    if (existing.length > 0) {
      await pool.query(
        'UPDATE user_answers SET selected_option_id = ?, is_correct = ?, time_spent_seconds = ? WHERE id = ?',
        [optionId, isCorrect, timeSpent, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO user_answers (attempt_id, question_id, selected_option_id, is_correct, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
        [attemptId, questionId, optionId, isCorrect, timeSpent]
      );
    }
  },

  async complete(attemptId, data) {
    await pool.query(`
      UPDATE test_attempts 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, time_taken_seconds = ?, 
          score = ?, total_marks = ?, correct_count = ?, incorrect_count = ?, 
          unanswered_count = ?, accuracy = ?
      WHERE id = ?
    `, [data.time_taken, data.score, data.total_marks, data.correct, data.incorrect, data.unanswered, data.accuracy, attemptId]);
  },

  async updateTabSwitchCount(attemptId, count) {
    await pool.query(
      'UPDATE test_attempts SET tab_switch_count = ? WHERE id = ?',
      [count, attemptId]
    );
  },

  async getAnswers(attemptId) {
    const [rows] = await pool.query(`
      SELECT ua.*, q.question_text, q.explanation, q.topic, q.marks,
             o_sel.option_text as selected_answer,
             o_cor.option_text as correct_answer,
             o_cor.id as correct_option_id
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      LEFT JOIN options o_sel ON ua.selected_option_id = o_sel.id
      LEFT JOIN options o_cor ON o_cor.question_id = q.id AND o_cor.is_correct = 1
      WHERE ua.attempt_id = ?
      ORDER BY ua.id
    `, [attemptId]);
    return rows;
  },

  async getUserStats(userId) {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_tests,
        AVG(accuracy) as avg_accuracy,
        AVG(score) as avg_score,
        SUM(correct_count) as total_correct,
        SUM(incorrect_count) as total_incorrect,
        MAX(score) as best_score
      FROM test_attempts 
      WHERE user_id = ? AND status = 'completed'
    `, [userId]);
    return rows[0];
  },

  async getRecentScores(userId, limit = 10) {
    const [rows] = await pool.query(`
      SELECT ta.score, ta.accuracy, ta.completed_at, t.title, t.category
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.user_id = ? AND ta.status = 'completed'
      ORDER BY ta.completed_at DESC
      LIMIT ?
    `, [userId, limit]);
    return rows;
  },

  async getTopicWiseStats(userId) {
    const [rows] = await pool.query(`
      SELECT 
        q.topic,
        COUNT(*) as total_questions,
        SUM(ua.is_correct) as correct,
        ROUND(SUM(ua.is_correct) / COUNT(*) * 100, 2) as accuracy,
        AVG(ua.time_spent_seconds) as avg_time
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      JOIN test_attempts ta ON ua.attempt_id = ta.id
      WHERE ta.user_id = ? AND ta.status = 'completed'
      GROUP BY q.topic
      ORDER BY accuracy ASC
    `, [userId]);
    return rows;
  },

  async getAllCompleted(limit = 50) {
    const [rows] = await pool.query(`
      SELECT ta.*, t.title as test_title, t.category, u.name as user_name, u.email
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN users u ON ta.user_id = u.id
      WHERE ta.status = 'completed'
      ORDER BY ta.completed_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  },

  async getDailyAttemptCount(userId) {
    const [rows] = await pool.query(`
      SELECT COUNT(*) as count FROM test_attempts 
      WHERE user_id = ? AND date(started_at) = date('now')
    `, [userId]);
    return rows[0].count;
  }
};

module.exports = Attempt;
