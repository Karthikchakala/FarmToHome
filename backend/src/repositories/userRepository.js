import { query } from '../config/db.js';

export const createUser = async (email, passwordHash, role) => {
    const result = await query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, is_active',
        [email, passwordHash, role]
    );
    return result.rows[0];
};

export const findUserByEmail = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

export const createConsumerProfile = async (userId, fullName, phone) => {
    const result = await query(
        'INSERT INTO consumers (user_id, full_name, phone) VALUES ($1, $2, $3) RETURNING id',
        [userId, fullName, phone]
    );
    return result.rows[0];
};

export const createFarmerProfile = async (userId, farmName, fullName, phone) => {
    const result = await query(
        'INSERT INTO farmers (user_id, farm_name, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, farmName, fullName, phone]
    );
    return result.rows[0];
};
