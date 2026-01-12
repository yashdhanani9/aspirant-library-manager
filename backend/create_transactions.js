const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log("Creating 'transactions' table if not exists...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(50) PRIMARY KEY,
                student_id VARCHAR(50),
                student_name VARCHAR(255),
                seat_number INTEGER,
                type VARCHAR(50),
                amount NUMERIC,
                date TIMESTAMP,
                plan_type VARCHAR(50),
                duration VARCHAR(50)
            );
        `);
        console.log("Table 'transactions' created successfully!");
    } catch (e) {
        console.error("Error creating table:", e);
    } finally {
        pool.end();
    }
})();
