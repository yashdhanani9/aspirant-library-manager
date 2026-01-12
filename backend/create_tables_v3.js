
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log("Checking tables for Payment Mode...");

        // Add payment_mode to students
        await pool.query(`
            ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) DEFAULT 'CASH';
        `);
        console.log("Added 'payment_mode' to students.");

        // Add payment_mode to transactions
        await pool.query(`
            ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) DEFAULT 'CASH';
        `);
        console.log("Added 'payment_mode' to transactions.");

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
})();
