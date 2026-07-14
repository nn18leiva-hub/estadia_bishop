require('dotenv').config();
const db = require('../src/config/db');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('Loganito2', 10);
    console.log('Password hash generated.');

    // ── Wipe existing accounts ─────────────────────────────────────────
    await db.query('DELETE FROM staff');
    await db.query('DELETE FROM parents');
    await db.query('DELETE FROM document_requests');
    await db.query('DELETE FROM payments');
    await db.query('DELETE FROM notifications');
    await db.query('DELETE FROM password_resets');
    console.log('All existing accounts cleared.');

    // Reset sequences so IDs start fresh
    await db.query(`ALTER SEQUENCE IF EXISTS staff_staff_id_seq RESTART WITH 1`);
    await db.query(`ALTER SEQUENCE IF EXISTS parents_parent_id_seq RESTART WITH 1`);
    console.log('Sequences reset.');

    // ── Insert staff: nn15leiva@gmail.com (staff) ──────────────────────
    await db.query(`
      INSERT INTO staff (full_name, email, password_hash, role, permissions, last_activity, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [
      'Staff User',
      'nn15leiva@gmail.com',
      hash,
      'staff',
      JSON.stringify({ admin_access: false, manage_requests: true, view_financials: false, verify_credentials: true }),
    ]);
    console.log('✅ Staff account created: nn15leiva@gmail.com');

    // ── Insert admin/superadmin: nn18leiva@gmail.com ───────────────────
    await db.query(`
      INSERT INTO staff (full_name, email, password_hash, role, permissions, last_activity, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [
      'Admin User',
      'nn18leiva@gmail.com',
      hash,
      'admin',
      JSON.stringify({ admin_access: true, manage_requests: true, view_financials: true, verify_credentials: true }),
    ]);
    console.log('✅ Admin account created: nn18leiva@gmail.com');

    // ── Insert parent/user: nn13leiva@gmail.com ────────────────────────
    // Check parents table columns first
    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'parents' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    const colNames = cols.rows.map(r => r.column_name);
    console.log('Parents table columns:', colNames);

    // Build insert based on available columns
    const hasFullName   = colNames.includes('full_name');
    const hasName       = colNames.includes('name');
    const hasVerified   = colNames.includes('is_verified');
    const hasSSN        = colNames.includes('ssn_verified');

    const nameCol    = hasFullName ? 'full_name' : 'name';
    const extraCols  = [hasVerified ? 'is_verified' : null, hasSSN ? 'ssn_verified' : null].filter(Boolean);
    const extraVals  = [hasVerified ? true : null, hasSSN ? false : null].filter(v => v !== null);

    const allCols = [nameCol, 'email', 'password_hash', ...extraCols];
    const allVals = ['Parent User', 'nn13leiva@gmail.com', hash, ...extraVals];
    const placeholders = allVals.map((_, i) => `$${i + 1}`).join(', ');

    await db.query(
      `INSERT INTO parents (${allCols.join(', ')}) VALUES (${placeholders})`,
      allVals
    );
    console.log('✅ Parent account created: nn13leiva@gmail.com');

    // ── Summary ────────────────────────────────────────────────────────
    console.log('\n── Final Account Summary ──');
    const staff = await db.query('SELECT staff_id, full_name, email, role FROM staff');
    staff.rows.forEach(r => console.log(`  [Staff]  id=${r.staff_id} | ${r.email} | role=${r.role}`));

    const parents = await db.query(`SELECT * FROM parents LIMIT 5`);
    parents.rows.forEach(r => console.log(`  [Parent] ${JSON.stringify(r)}`));

    console.log('\n✅ All done. Password for all accounts: Loganito2');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
