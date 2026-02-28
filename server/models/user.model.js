const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({ name, email, password, role = 'USER' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    return rows;
  },

  async updateRole(userId, role) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  },

  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
};

module.exports = User;
