require('dotenv').config();
const db = require('../src/config/db');
(async () => {
  const r = await db.query(
    "SELECT pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname='staff_role_check'"
  );
  console.log('Role constraint:', r.rows[0]?.def);
  process.exit(0);
})();
