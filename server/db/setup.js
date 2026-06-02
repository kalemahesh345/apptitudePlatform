const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../apptitude.sqlite');
const schemaPath = path.join(__dirname, 'schema.sqlite.sql');

async function setup() {
  console.log('⏳ Starting Database Setup...');
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Database connection error:', err.message);
      process.exit(1);
    }
  });

  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Schema execution error:', err.message);
      } else {
        console.log('✅ Database schema created explicitly for SQLite!');
      }
      db.close();
    });
  } catch (error) {
    console.error('❌ Error reading schema file:', error.message);
    db.close();
  }
}

setup();
