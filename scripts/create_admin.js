const db = require('./src/config/db');
const bcrypt = require('bcrypt');
(async () => {
    try {
        const hash = await bcrypt.hash('password123', 10);
        await db.query("INSERT INTO staff (full_name, email, password_hash, role) VALUES ('Default Admin', 'admin@bmhs.edu.bz', $1, 'staff') ON CONFLICT (email) DO NOTHING", [hash]);
        await db.query("INSERT INTO staff (full_name, email, password_hash, role) VALUES ('Super Admin', 'superadmin@bmhs.edu.bz', $1, 'admin') ON CONFLICT (email) DO NOTHING", [hash]);
        console.log('Created staff and admin');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
})();
