// import pg from 'pg';
// import dotenv from 'dotenv';
// import logger from './logger.js';
// const { Pool } = pg;

// dotenv.config();

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
//         ? { rejectUnauthorized: false }
//         : false
// });

// pool.on('connect', () => {
//     logger.info('Connected to PostgreSQL Database.');
// });

// pool.on('error', (err) => {
//     logger.error('Unexpected error on idle client', err);
//     process.exit(-1);
// });

// export const query = (text, params) => pool.query(text, params);
// export const getClient = () => pool.connect();
// export default pool;
import pg from "pg";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on("connect", () => {
    logger.info("Connected to PostgreSQL (Supabase)");
});

pool.on("error", (err) => {
    logger.error("Unexpected error on idle client", err);
    process.exit(-1);
});

export const query = (text, params) =>
    pool.query({
        text,
        values: params
    });

export const getClient = () => pool.connect();

export default pool;