const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../database/update_request_verification_migration.sql'), 'utf8');
  console.log('Running migration...');
  await db.query(sql);
  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
