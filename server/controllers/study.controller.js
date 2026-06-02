const pool = require('../config/db');

// Get all study materials
const getMaterials = async (req, res, next) => {
  try {
    const { topic, category, type } = req.query;
    let query = 'SELECT * FROM study_materials WHERE 1=1';
    const params = [];

    if (topic) { query += ' AND topic = ?'; params.push(topic); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (type) { query += ' AND type = ?'; params.push(type); }

    // Removed the is_premium check as it does not exist in schema
    query += ' ORDER BY created_at DESC';
    const [materials] = await pool.query(query, params);
    res.json({ materials });
  } catch (error) {
    next(error);
  }
};

// Get material by ID
const getMaterialById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM study_materials WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json({ material: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Get topics list
const getTopics = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT topic, category, COUNT(*) as material_count 
      FROM study_materials 
      GROUP BY topic, category 
      ORDER BY category, topic
    `);
    res.json({ topics: rows });
  } catch (error) {
    next(error);
  }
};

// Create a new study material (Admin)
const createMaterial = async (req, res, next) => {
  try {
    const { title, content, topic, category, type, video_url, file_url } = req.body;
    const [result] = await pool.query(
      'INSERT INTO study_materials (title, content, topic, category, type, video_url, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, topic, category, type || 'notes', video_url, file_url]
    );
    res.status(201).json({ message: 'Material created successfully', id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Update study material (Admin)
const updateMaterial = async (req, res, next) => {
  try {
    const { title, content, topic, category, type, video_url, file_url } = req.body;
    await pool.query(
      'UPDATE study_materials SET title = ?, content = ?, topic = ?, category = ?, type = ?, video_url = ?, file_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, topic, category, type, video_url, file_url, req.params.id]
    );
    res.json({ message: 'Material updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete study material (Admin)
const deleteMaterial = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM study_materials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMaterials, getMaterialById, getTopics, createMaterial, updateMaterial, deleteMaterial };
