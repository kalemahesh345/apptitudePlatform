const pool = require('../config/db');

// Get subscription status
const getSubscription = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY expires_at DESC LIMIT 1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.json({ subscription: null, isPremium: req.user.role === 'PREMIUM' });
    }

    // Check if expired
    if (new Date(rows[0].expires_at) < new Date()) {
      await pool.query('UPDATE subscriptions SET status = "expired" WHERE id = ?', [rows[0].id]);
      await pool.query('UPDATE users SET role = "USER" WHERE id = ?', [req.user.id]);
      return res.json({ subscription: null, isPremium: false });
    }

    res.json({ subscription: rows[0], isPremium: true });
  } catch (error) {
    next(error);
  }
};

// Subscribe (simplified - in production would integrate payment gateway)
const subscribe = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['monthly', 'quarterly', 'yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Calculate expiry
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (plan === 'quarterly') expiresAt.setMonth(expiresAt.getMonth() + 3);
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create subscription
    await pool.query(
      'INSERT INTO subscriptions (user_id, plan, expires_at) VALUES (?, ?, ?)',
      [req.user.id, plan, expiresAt]
    );

    // Upgrade user role
    await pool.query('UPDATE users SET role = "PREMIUM" WHERE id = ?', [req.user.id]);

    res.json({ 
      message: 'Subscription activated!', 
      plan, 
      expiresAt: expiresAt.toISOString() 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubscription, subscribe };
