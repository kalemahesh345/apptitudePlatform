const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../apptitude.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ SQLite database connected successfully');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');
  }
});

// Create a wrapper to mimic mysql2/promise pool interface
const pool = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // If it's a SELECT statement or uses RETURNING
      if (sql.trim().toUpperCase().startsWith('SELECT') || sql.toUpperCase().includes('RETURNING')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows]);
        });
      } else {
        // For INSERT, UPDATE, DELETE
        db.run(sql, params, function(err) {
          if (err) reject(err);
          // Return an array with an object containing insertId to mimic mysql2 behavior
          else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        });
      }
    });
  }
};

module.exports = pool;
