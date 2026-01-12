const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log("Checking if 'gender' column exists...");
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(50);');
        console.log("Column 'gender' added successfully!");
    } catch (e) {
        console.error("Error adding column:", e);
    } finally {
        pool.end();
    }
})();
