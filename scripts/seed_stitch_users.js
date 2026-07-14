const db = require('../src/config/db');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);

    // Truncate tables
    await db.query('TRUNCATE TABLE payments, document_requests, staff, parents CASCADE');

    console.log('Cleared existing database tables.');

    // Seed Staff
    // 1. admin@bishopmartin.edu (admin, System Administrator)
    await db.query(
      "INSERT INTO staff (full_name, email, password_hash, role, last_activity) VALUES ($1, $2, $3, $4, NOW())",
      ['System Administrator', 'admin@bishopmartin.edu', hash, 'admin']
    );

    // 2. Dr. Elena Sterling (staff, Head of Registrar) - Active 42m ago
    await db.query(
      "INSERT INTO staff (full_name, email, password_hash, role, last_activity) VALUES ($1, $2, $3, $4, NOW() - INTERVAL '42 minutes')",
      ['Dr. Elena Sterling', 'e.sterling@bishopmartin.edu', hash, 'staff']
    );

    // 3. Arthur Vance (viewer, Facilities Manager) - Last active Oct 12, 2023
    await db.query(
      "INSERT INTO staff (full_name, email, password_hash, role, last_activity) VALUES ($1, $2, $3, $4, '2023-10-12 14:30:00')",
      ['Arthur Vance', 'a.vance@bishopmartin.edu', hash, 'viewer']
    );

    // 4. Sarah Miller (staff, Department Head) - Last active Yesterday 14:20
    // Yesterday 14:20 can be represented as 1 day and some hours ago
    await db.query(
      "INSERT INTO staff (full_name, email, password_hash, role, last_activity) VALUES ($1, $2, $3, $4, NOW() - INTERVAL '1 day' - INTERVAL '2 hours')",
      ['Sarah Miller', 's.miller@bishopmartin.edu', hash, 'staff']
    );

    console.log('Seeded staff users matching Stitch template.');

    // Seed Parents
    // 1. Julian Thorne (Parent / Guardian) - Pending Verification
    await db.query(
      "INSERT INTO parents (full_name, email, password_hash, user_type, verified, last_activity) VALUES ($1, $2, $3, $4, $5, NULL)",
      ['Julian Thorne', 'j.thorne@guardian.edu', hash, 'parent', false]
    );

    // 2. Nelson Leiva (Parent / Guardian) - Active
    await db.query(
      "INSERT INTO parents (full_name, email, password_hash, user_type, verified, last_activity) VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 hours')",
      ['Nelson Leiva', 'nn13leiva@gmail.com', hash, 'parent', true]
    );

    console.log('Seeded parent users matching Stitch template.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed stitch users:', err);
    process.exit(1);
  }
})();
