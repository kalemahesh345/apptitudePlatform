const pool = require('../config/db');

const Question = {
  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO questions (test_id, question_text, explanation, topic, difficulty, marks, negative_marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.test_id, data.question_text, data.explanation, data.topic, data.difficulty, data.marks || 1, data.negative_marks || 0]
    );
    const questionId = result.insertId;

    // Insert options
    if (data.options && data.options.length > 0) {
      for (const opt of data.options) {
        await pool.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
          [questionId, opt.option_text, opt.is_correct || false]
        );
      }
    }

    // Update test total marks
    await pool.query(
      'UPDATE tests SET total_marks = total_marks + ? WHERE id = ?',
      [data.marks || 1, data.test_id]
    );

    return questionId;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const question = rows[0];
    const [options] = await pool.query('SELECT * FROM options WHERE question_id = ?', [id]);
    question.options = options;
    return question;
  },

  async findByTestId(testId) {
    const [rows] = await pool.query('SELECT * FROM questions WHERE test_id = ?', [testId]);
    for (let q of rows) {
      const [options] = await pool.query('SELECT * FROM options WHERE question_id = ?', [q.id]);
      q.options = options;
    }
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    ['question_text', 'explanation', 'topic', 'difficulty', 'marks', 'negative_marks'].forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    if (fields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    // Update options if provided
    if (data.options) {
      await pool.query('DELETE FROM options WHERE question_id = ?', [id]);
      for (const opt of data.options) {
        await pool.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
          [id, opt.option_text, opt.is_correct || false]
        );
      }
    }
  },

  async delete(id) {
    // Get marks to subtract from test
    const [q] = await pool.query('SELECT test_id, marks FROM questions WHERE id = ?', [id]);
    if (q.length > 0) {
      await pool.query('UPDATE tests SET total_marks = GREATEST(total_marks - ?, 0) WHERE id = ?', [q[0].marks, q[0].test_id]);
    }
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
  },

  async getCorrectOption(questionId) {
    const [rows] = await pool.query(
      'SELECT id FROM options WHERE question_id = ? AND is_correct = 1 LIMIT 1',
      [questionId]
    );
    return rows[0] || null;
  },

  async getStats() {
    const [rows] = await pool.query(`
      SELECT topic, difficulty, COUNT(*) as count 
      FROM questions 
      GROUP BY topic, difficulty 
      ORDER BY topic, difficulty
    `);
    return rows;
  }
};

module.exports = Question;
