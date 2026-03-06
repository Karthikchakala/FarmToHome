import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
dotenv.config();

export const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Decode token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user details from token payload directly
            req.user = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email
            };

            next();
        } catch (error) {
            logger.error(`Token verification failed: ${error.message}`);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role ${req.user ? req.user.role : 'UNKNOWN'} is not authorized to access this route`);
        }
        next();
    };
};
