require('dotenv').config();
const db = require('../src/config/db');
(async () => {
  try {
    const res = await db.query("SELECT * FROM staff");
    console.log("Staff accounts in database:", res.rows);
    process.exit(0);
  } catch(err) {
    console.error("Error querying db:", err);
    process.exit(1);
  }
})();
