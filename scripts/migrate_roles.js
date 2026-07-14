require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  try {
    console.log('Starting role migration...');
    
    // 1. Drop existing constraint
    await db.query(`ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check`);
    console.log('Dropped old staff_role_check constraint.');

    // 2. Update the values
    // Update admin to staff first
    await db.query(`UPDATE staff SET role = 'staff' WHERE role = 'admin'`);
    console.log("Updated 'admin' to 'staff' in staff table.");

    // Update super_admin to admin second
    await db.query(`UPDATE staff SET role = 'admin' WHERE role = 'super_admin'`);
    console.log("Updated 'super_admin' to 'admin' in staff table.");

    // 3. Add new check constraint
    await db.query(`
      ALTER TABLE staff ADD CONSTRAINT staff_role_check 
      CHECK (role IN ('viewer', 'staff', 'admin'))
    `);
    console.log("Added new staff_role_check constraint allowing 'viewer', 'staff', 'admin'.");

    console.log('Role migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
})();
