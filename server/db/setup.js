require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
  // First connect without database to create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'system',
    multipleStatements: true
  });

  console.log('🔗 Connected to MySQL server');

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = schema.split(';').filter(s => s.trim().length > 0);
  
  for (const stmt of statements) {
    try {
      await conn.query(stmt + ';');
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message.includes('already exists')) {
        console.log(`⚠️  ${err.message.substring(0, 80)}`);
      }
    }
  }

  console.log('✅ Database schema created successfully');
  await conn.end();
}

setup().catch(err => {
  console.error('❌ Setup error:', err.message);
  process.exit(1);
});
