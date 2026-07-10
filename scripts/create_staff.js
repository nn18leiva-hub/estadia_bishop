const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const users = [
    { full_name: 'Super Admin', email: 'nn19leiva@gmail.com', password: 'Loganito2', role: 'super_admin' },
];

async function run() {
    for (const u of users) {
        // Delete if exists
        await pool.query('DELETE FROM staff WHERE email = $1', [u.email]);
        console.log(`Deleted existing user (if any): ${u.email}`);

        // Hash password
        const hash = await bcrypt.hash(u.password, 10);

        // Insert
        await pool.query(
            'INSERT INTO staff (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [u.full_name, u.email, hash, u.role]
        );
        console.log(`✅ Created ${u.role} — ${u.email}`);
    }

    await pool.end();
    console.log('Done!');
}

run().catch(err => { console.error(err); process.exit(1); });
