const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Config (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Helper: Snake to Camel Case
const snakeToCamel = (s) => {
    if (!s) return null;
    return {
        id: s.id,
        fullName: s.full_name,
        // ... (keep all matching fields)
        mobile: s.mobile,
        email: s.email,
        password: s.password,
        address: s.address,
        parentName: s.parent_name,
        parentMobile: s.parent_mobile,
        seatNumber: s.seat_number,
        lockerRequired: s.locker_required,
        planType: s.plan_type,
        duration: s.duration,
        startDate: s.start_date,
        endDate: s.end_date,
        amountPaid: s.amount_paid,
        assignedSlots: s.assigned_slots || [],
        isActive: s.is_active,
        photoUrl: s.photo_url,
        idProofUrl: s.id_proof_url,
        idProofType: s.id_proof_type, // Fixed: Was missing
        gender: s.gender,
        paymentMode: s.payment_mode
    };
};

// ...

// 2. STUDENTS (GET & ADD)
app.get('/api/students', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM students ORDER BY start_date DESC');
        res.json(rows.map(snakeToCamel));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const s = req.body;
        const query = `
      INSERT INTO students (
        id, full_name, mobile, email, password, address, parent_name, parent_mobile, 
        seat_number, locker_required, plan_type, duration, start_date, end_date, 
        amount_paid, assigned_slots, is_active, id_proof_type, photo_url, id_proof_url, gender, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *;
    `;
        const values = [
            s.id, s.fullName, s.mobile, s.email, s.password, s.address, s.parentName, s.parentMobile,
            s.seatNumber, s.lockerRequired, s.planType, s.duration, s.startDate, s.endDate,
            s.amountPaid, s.assignedSlots, true, s.idProofType, s.photoUrl, s.idProofUrl, s.gender, s.paymentMode || 'CASH'
        ];

        const { rows } = await pool.query(query, values);


        // Also Log Transaction
        await pool.query(
            `INSERT INTO transactions (id, student_id, student_name, seat_number, type, amount, date, plan_type, duration, payment_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [`tx_${Date.now()}`, s.id, s.fullName, s.seatNumber, 'ADMISSION', s.amountPaid, s.startDate, s.planType, s.duration, s.paymentMode || 'CASH']
        );

        res.json(snakeToCamel(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Student
app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const s = req.body;

        const query = `
            UPDATE students SET
                full_name = $1, mobile = $2, email = $3, password = $4, address = $5,
                parent_name = $6, parent_mobile = $7, seat_number = $8, locker_required = $9,
                plan_type = $10, duration = $11, start_date = $12, end_date = $13,
                amount_paid = $14, assigned_slots = $15, id_proof_type = $16,
                photo_url = $17, id_proof_url = $18, gender = $19, payment_mode = $20
            WHERE id = $21
            RETURNING *;
        `;

        const values = [
            s.fullName, s.mobile, s.email, s.password, s.address, s.parentName, s.parentMobile,
            s.seatNumber, s.lockerRequired, s.planType, s.duration, s.startDate, s.endDate,
            s.amountPaid, s.assignedSlots, s.idProofType, s.photoUrl, s.idProofUrl, s.gender, s.paymentMode || 'CASH', id
        ];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(snakeToCamel(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. LOGIN
app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    try {
        if (mobile === 'admin' && password === 'admin') {
            return res.json({ role: 'ADMIN', user: null });
        }
        const { rows } = await pool.query('SELECT * FROM students WHERE mobile = $1 AND password = $2 AND is_active = true', [mobile, password]);
        if (rows.length > 0) {
            res.json({ role: 'STUDENT', user: snakeToCamel(rows[0]) });
        } else {
            res.status(401).json({ error: 'Invalid Credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. GET SEATS
app.get('/api/seats', async (req, res) => {
    try {
        const { rows: students } = await pool.query('SELECT * FROM students WHERE is_active = true');
        const studentObjs = students.map(snakeToCamel);
        const seats = [];
        for (let i = 1; i <= 121; i++) { // TOTAL_SEATS
            const occupants = studentObjs.filter(s => s.seatNumber === i);
            seats.push({
                id: i,
                isLockerTaken: occupants.some(s => s.lockerRequired),
                occupants
            });
        }
        res.json(seats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 5. WIFI & ANNOUNCEMENTS
app.get('/api/wifi', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM wifi_networks');
    res.json(rows);
});

app.post('/api/wifi', async (req, res) => {
    const { ssid, password } = req.body;
    await pool.query('INSERT INTO wifi_networks (id, ssid, password) VALUES ($1, $2, $3)', [Date.now().toString(), ssid, password]);
    res.json({ success: true });
});

app.delete('/api/wifi/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM wifi_networks WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/announcement', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM announcements ORDER BY updated_at DESC LIMIT 1');
    res.json(rows[0] || { message: '', isActive: false });
});

app.post('/api/announcement', async (req, res) => {
    const { message, isActive } = req.body;
    await pool.query('INSERT INTO announcements (message, is_active) VALUES ($1, $2)', [message, isActive]);
    res.json({ success: true });
});

// 6. GET TRANSACTIONS
app.get('/api/transactions', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        res.json(rows.map(t => ({
            id: t.id,
            studentId: t.student_id,
            studentName: t.student_name,
            seatNumber: t.seat_number,
            type: t.type,
            amount: Number(t.amount),
            date: t.date,
            planType: t.plan_type,
            duration: t.duration,
            paymentMode: t.payment_mode
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
