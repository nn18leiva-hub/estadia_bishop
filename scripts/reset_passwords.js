require('dotenv').config();
const db = require('../src/config/db');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);
    // Update the password hashes of all seeded staff
    await db.query("UPDATE staff SET password_hash = $1 WHERE email IN ('principal@bmhs.edu.bz', 'office@bmhs.edu.bz', 'superadmin@bmhs.edu.bz', 'admin@bishopmartin.edu')", [hash]);
    console.log('Successfully reset all staff passwords to password123');
    process.exit(0);
  } catch(err) {
    console.error('Failed to reset passwords:', err);
    process.exit(1);
  }
})();
