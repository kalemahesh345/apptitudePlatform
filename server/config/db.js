const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'system',
  database: process.env.DB_NAME || 'apptitude_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
    console.error('   Please ensure MySQL is running and the database "apptitude_db" exists.');
    console.error('   Run: mysql -u root -p < db/schema.sql');
  });

module.exports = pool;
