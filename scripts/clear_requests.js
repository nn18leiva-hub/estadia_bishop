const db = require('../src/config/db');

async function clearRequests() {
  console.log('Clearing local database requests and payments...');
  try {
    await db.query('TRUNCATE TABLE payments, document_requests RESTART IDENTITY CASCADE;');
    console.log('✅ Local database requests and payments successfully cleared!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing local database:', err.message);
    process.exit(1);
  }
}

clearRequests();
