const db = require('../src/config/db');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('Loganito2', 10);
    const result = await db.query(
      "UPDATE staff SET password_hash = $1, role = 'admin', full_name = 'Nelson Leiva', last_activity = NOW() WHERE email = $2 RETURNING staff_id, full_name, email, role",
      [hash, 'nn15leiva@gmail.com']
    );
    if (result.rows.length > 0) {
      console.log('✅ Staff account updated successfully!');
      console.log(result.rows[0]);
    } else {
      console.log('No existing account found, inserting...');
      await db.query(
        "INSERT INTO staff (full_name, email, password_hash, role, last_activity) VALUES ($1, $2, $3, 'admin', NOW())",
        ['Nelson Leiva', 'nn15leiva@gmail.com', hash]
      );
      console.log('✅ Staff account created!');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
