import * as authService from '../services/authService.js';
import logger from '../config/logger.js';

export const register = async (req, res, next) => {
    console.log("REGISTER API HIT");
    console.log("--> ENTERED authController.register");
    console.log("PAYLOAD RECEIVED:", req.body);
    try {
        console.log("--> Calling authService.registerUser");
        const { user, token } = await authService.registerUser(req.body);
        console.log("--> authService.registerUser RETURNED");
        logger.info(`User registered: ${user.email} with role ${user.role}`);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser(email, password);
        logger.info(`User logged in: ${user.email}`);

        res.status(200).json({
            message: 'Login successful',
            user,
            token
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        // req.user is populated by the authMiddleware
        res.status(200).json({
            user: req.user
        });
    } catch (error) {
        next(error);
    }
};
