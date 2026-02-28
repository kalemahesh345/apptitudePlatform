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
    
    // Non-premium filter
    if (req.user.role !== 'PREMIUM' && req.user.role !== 'ADMIN') {
      query += ' AND is_premium = FALSE';
    }

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

module.exports = { getMaterials, getMaterialById, getTopics };
