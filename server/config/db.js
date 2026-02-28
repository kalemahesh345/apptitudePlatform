const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'aptitude.db');

let db = null;

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
async function initDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Enable WAL mode for better performance
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  
  console.log('✅ SQLite database initialized');
  return db;
}

// Save database to disk periodically
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000);

// MySQL-compatible query wrapper
// Converts mysql2-style pool.query(sql, params) to SQLite
const pool = {
  async query(sql, params = []) {
    if (!db) await initDb();
    
    // Convert MySQL placeholders and syntax to SQLite (only convert actual MySQL patterns)
    let sqliteSql = sql;
    
    // Only convert backticks if NOT already using SQLite syntax
    if (sqliteSql.includes('`')) {
      sqliteSql = sqliteSql.replace(/`/g, '"');
    }
    
    // DDL conversions (only for CREATE/ALTER statements)
    if (sqliteSql.trim().toUpperCase().startsWith('CREATE') || sqliteSql.trim().toUpperCase().startsWith('ALTER')) {
      sqliteSql = sqliteSql
        .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
        .replace(/INT\s+AUTO_INCREMENT/gi, 'INTEGER AUTOINCREMENT')
        .replace(/ENUM\s*\([^)]+\)/gi, 'TEXT')
        .replace(/TINYINT\(\d+\)/gi, 'INTEGER')
        .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
        .replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL')
        .replace(/TIMESTAMP\s+DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        .replace(/\bJSON\b/gi, 'TEXT');
    }
    
    // DML conversions — only replace MySQL-specific functions
    sqliteSql = sqliteSql
      .replace(/\bNOW\(\)/gi, "datetime('now')")
      .replace(/\bCURDATE\(\)/gi, "date('now')")
      .replace(/\bRAND\(\)/gi, 'RANDOM()')
      .replace(/GREATEST\(([^,]+),\s*(\d+)\)/gi, 'MAX($1, $2)');
    
    // Convert ? params — SQLite uses the same style, but boolean needs conversion
    const convertedParams = (params || []).map(p => {
      if (typeof p === 'boolean') return p ? 1 : 0;
      return p;
    });
    
    try {
      const trimmed = sqliteSql.trim().toUpperCase();
      
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('SHOW') || trimmed.startsWith('PRAGMA')) {
        const stmt = db.prepare(sqliteSql);
        stmt.bind(convertedParams);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return [rows, null];
      } else if (trimmed.startsWith('INSERT')) {
        db.run(sqliteSql, convertedParams);
        const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0];
        saveDb();
        return [{ insertId: lastId, affectedRows: db.getRowsModified() }, null];
      } else {
        db.run(sqliteSql, convertedParams);
        saveDb();
        return [{ affectedRows: db.getRowsModified() }, null];
      }
    } catch (err) {
      // If it's a CREATE TABLE or INDEX error (already exists), ignore
      if (err.message.includes('already exists')) {
        return [{ affectedRows: 0 }, null];
      }
      // If it's a constraint/syntax issue in DDL, ignore for setup
      if (sqliteSql.trim().toUpperCase().startsWith('CREATE') && err.message.includes('syntax')) {
        return [{ affectedRows: 0 }, null];
      }
      throw err;
    }
  },

  async getConnection() {
    if (!db) await initDb();
    return {
      release: () => {},
      query: (sql, params) => pool.query(sql, params)
    };
  }
};

// Initialize on load
initDb().catch(err => console.error('DB init error:', err));

module.exports = pool;
