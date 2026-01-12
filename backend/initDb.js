const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createTablesQuery = `
  -- 1. Students Table
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    password TEXT NOT NULL,
    address TEXT,
    parent_name TEXT,
    parent_mobile TEXT,
    seat_number INTEGER,
    locker_required BOOLEAN DEFAULT FALSE,
    plan_type TEXT,
    duration TEXT,
    start_date DATE,
    end_date DATE,
    amount_paid INTEGER,
    assigned_slots TEXT[], -- Array of strings e.g. ['S1', 'S2']
    is_active BOOLEAN DEFAULT TRUE,
    id_proof_type TEXT,
    photo_url TEXT,
    id_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. Transactions Table
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id),
    student_name TEXT,
    seat_number INTEGER,
    type TEXT, -- 'ADMISSION', 'RENEWAL'
    amount INTEGER,
    date DATE,
    plan_type TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. Wifi Networks Table
  CREATE TABLE IF NOT EXISTS wifi_networks (
    id TEXT PRIMARY KEY,
    ssid TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Global Announcements Table
  CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    message TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Admission Requests Table
  CREATE TABLE IF NOT EXISTS admission_requests (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    address TEXT,
    plan_type TEXT,
    duration TEXT,
    locker_required BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    id_proof_url TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const runMigration = async () => {
    try {
        console.log('🔄 Connecting to Database...');
        const client = await pool.connect();
        console.log('🔨 Creating Tables...');
        await client.query(createTablesQuery);
        console.log('✅ All Tables Created Successfully!');
        client.release();
        pool.end();
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        pool.end();
    }
};

runMigration();
