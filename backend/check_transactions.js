const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const check = async () => {
    try {
        const { rows } = await pool.query('SELECT * FROM transactions');
        console.log('Transactions Count:', rows.length);
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
};

check();
