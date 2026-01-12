
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log("Checking tables...");

        // WiFi Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wifi_networks (
                id VARCHAR(50) PRIMARY KEY,
                ssid VARCHAR(255),
                password VARCHAR(255)
            );
        `);
        console.log("Verified 'wifi_networks'.");

        // Announcements Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                message TEXT,
                is_active BOOLEAN,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                type VARCHAR(20) DEFAULT 'ALERT'
            );
        `);
        console.log("Verified 'announcements' (with type column).");

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
})();
