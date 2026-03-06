import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';
import dotenv from 'dotenv';
dotenv.config();

const generateToken = (id, role, email) => {
    return jwt.sign({ id, role, email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};

export const registerUser = async (data) => {
    console.log("--> ENTERED authService.registerUser");
    const { email, password, role, fullName, phone, farmName } = data;

    // Check if user exists
    console.log("--> Checking if user exists in DB:", email);
    const userExists = await userRepository.findUserByEmail(email);
    console.log("--> userExists check result:", !!userExists);
    if (userExists) {
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Transaction for creating user and profile
    const { getClient } = await import('../config/db.js');
    const client = await getClient();
    let user;

    try {
        console.log("--> Starting database transaction");
        await client.query('BEGIN');

        console.log("--> Inserting into users table");
        const userResult = await client.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, passwordHash, role]
        );
        user = userResult.rows[0];
        console.log("--> Inserted basic user");

        if (role === 'consumer') {
            await client.query(
                'INSERT INTO consumers (user_id, full_name, phone) VALUES ($1, $2, $3)',
                [user.id, fullName, phone]
            );
        } else if (role === 'farmer') {
            await client.query(
                'INSERT INTO farmers (user_id, farm_name, full_name, phone) VALUES ($1, $2, $3, $4)',
                [user.id, farmName, fullName, phone]
            );
        } // admin role skips profile creation for now

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

    const token = generateToken(user.id, user.role, user.email);
    return { user, token };
};

export const loginUser = async (email, password) => {
    const user = await userRepository.findUserByEmail(email);

    if (user && (await bcrypt.compare(password, user.password_hash))) {
        if (!user.is_active) throw new Error('Account is banned or inactive');

        const token = generateToken(user.id, user.role, user.email);
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token
        };
    } else {
        throw new Error('Invalid email or password');
    }
};
