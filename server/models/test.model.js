const pool = require('../config/db');

const Test = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM tests WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.difficulty) {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }
    if (filters.is_premium !== undefined) {
      query += ' AND is_premium = ?';
      params.push(filters.is_premium);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tests WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO tests (title, description, category, difficulty, duration_minutes, total_marks, is_premium, is_adaptive, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.title, data.description, data.category, data.difficulty, data.duration_minutes, data.total_marks, data.is_premium || false, data.is_adaptive || false, data.created_by]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    Object.keys(data).forEach(key => {
      if (['title', 'description', 'category', 'difficulty', 'duration_minutes', 'total_marks', 'is_premium', 'is_adaptive'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    params.push(id);
    await pool.query(`UPDATE tests SET ${fields.join(', ')} WHERE id = ?`, params);
  },

  async delete(id) {
    await pool.query('DELETE FROM tests WHERE id = ?', [id]);
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM tests');
    return rows[0].count;
  },

  async getQuestionsForTest(testId) {
    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE test_id = ? ORDER BY RANDOM()',
      [testId]
    );
    
    for (let q of questions) {
      const [options] = await pool.query(
        'SELECT id, option_text FROM options WHERE question_id = ? ORDER BY RANDOM()',
        [q.id]
      );
      q.options = options;
    }
    return questions;
  }
};

module.exports = Test;
