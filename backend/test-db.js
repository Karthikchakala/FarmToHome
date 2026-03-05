import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    console.log("Testing database connection...");

    try {
        const res = await pool.query("SELECT NOW()");
        console.log("✅ Database connected");
        console.log(res.rows);
    } catch (err) {
        console.error("❌ Connection error:");
        console.error(err);
    } finally {
        await pool.end();
    }
}

testConnection();