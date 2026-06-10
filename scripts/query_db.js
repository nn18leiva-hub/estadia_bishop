const db = require('../src/config/db');

(async () => {
  try {
    const staff = await db.query("SELECT staff_id, full_name, email, role FROM staff");
    console.log("=== STAFF ===");
    console.log(staff.rows);

    const parents = await db.query("SELECT parent_id, full_name, email, user_type FROM parents");
    console.log("=== PARENTS ===");
    console.log(parents.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
