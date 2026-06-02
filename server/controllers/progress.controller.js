const pool = require('../config/db');

// Get user progress overview
const getProgress = async (req, res, next) => {
  try {
    const [progress] = await pool.query(
      'SELECT * FROM progress WHERE user_id = ? ORDER BY accuracy DESC',
      [req.user.id]
    );

    // Calculate overall progress
    const totalTopics = progress.length;
    const masteredTopics = progress.filter(p => p.skill_level === 'advanced' || p.skill_level === 'expert').length;
    const overallProgress = totalTopics > 0 ? ((masteredTopics / totalTopics) * 100).toFixed(1) : 0;

    res.json({ progress, overallProgress, totalTopics, masteredTopics });
  } catch (error) {
    next(error);
  }
};

// Get weekly/monthly performance trend
const getPerformanceTrend = async (req, res, next) => {
  try {
    const { period = 'weekly' } = req.query;
    let dateFormat, dateRange;

    if (period === 'monthly') {
      dateFormat = '%Y-%m';
      dateRange = "date('now', '-6 months')";
    } else {
      dateFormat = '%Y-%W';
      dateRange = "date('now', '-8 weeks')";
    }

    const [trends] = await pool.query(`
      SELECT 
        strftime('${dateFormat}', completed_at) as period,
        COUNT(*) as tests_taken,
        AVG(accuracy) as avg_accuracy,
        AVG(score) as avg_score
      FROM test_attempts
      WHERE user_id = ? AND status = 'completed' AND completed_at >= ${dateRange}
      GROUP BY period
      ORDER BY period
    `, [req.user.id]);

    res.json({ trends });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProgress, getPerformanceTrend };
