const db = require('../src/config/db');

async function checkDb() {
  const parents = await db.query('SELECT parent_id, email, verified, ssn_card_image_path FROM parents ORDER BY created_at DESC LIMIT 10');
  console.log('=== Recent Parents ===');
  console.log(JSON.stringify(parents.rows, null, 2));

  const requests = await db.query('SELECT r.request_id, r.status, r.document_type_id, r.parent_id, p.email, r.student_full_name FROM document_requests r JOIN parents p ON p.parent_id = r.parent_id ORDER BY r.request_date DESC LIMIT 10');
  console.log('\n=== Recent Requests ===');
  console.log(JSON.stringify(requests.rows, null, 2));

  const payments = await db.query('SELECT payment_id, request_id, verified, transfer_reference FROM payments ORDER BY payment_date DESC LIMIT 10');
  console.log('\n=== Recent Payments ===');
  console.log(JSON.stringify(payments.rows, null, 2));

  const staff = await db.query('SELECT staff_id, full_name, email, role FROM staff');
  console.log('\n=== Staff ===');
  console.log(JSON.stringify(staff.rows, null, 2));

  process.exit(0);
}
checkDb().catch(err => { console.error(err.message); process.exit(1); });
