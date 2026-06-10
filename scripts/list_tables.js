require('dotenv').config();
const db = require('../src/config/db');
(async () => {
  try {
    const tables = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    console.log('All tables:', tables.rows.map(r => r.table_name));

    for (const { table_name } of tables.rows) {
      const count = await db.query(`SELECT COUNT(*) FROM "${table_name}"`);
      console.log(`  ${table_name}: ${count.rows[0].count} rows`);
    }
    process.exit(0);
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
