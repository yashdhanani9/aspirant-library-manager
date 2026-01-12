const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
    try {
        console.log('Starting Transaction Backfill...');

        // 1. Get all students
        const { rows: students } = await pool.query('SELECT * FROM students');
        console.log(`Found ${students.length} students.`);

        // 2. Get all transactions to avoid duplicates
        const { rows: transactions } = await pool.query('SELECT student_id FROM transactions');
        const existingStudentIds = new Set(transactions.map(t => t.student_id));

        let addedCount = 0;

        for (const s of students) {
            if (!existingStudentIds.has(s.id)) {
                // Insert mock transaction based on admission
                const txId = `tx_bf_${s.id}`; // deterministic ID for backfill
                const amount = s.amount_paid || 0;

                // Skip if no amount
                if (amount <= 0) continue;

                await pool.query(
                    `INSERT INTO transactions (id, student_id, student_name, seat_number, type, amount, date, plan_type, duration, payment_mode)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        txId,
                        s.id,
                        s.full_name,
                        s.seat_number,
                        'ADMISSION',
                        amount,
                        s.start_date || new Date().toISOString(), // Fallback to now if null
                        s.plan_type || 'Monthly',
                        s.duration || 'Full Day',
                        s.payment_mode || 'CASH'
                    ]
                );
                addedCount++;
                process.stdout.write('.');
            }
        }

        console.log(`\nMigration Complete. Added ${addedCount} missing transactions.`);
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        await pool.end();
    }
};

migrate();
