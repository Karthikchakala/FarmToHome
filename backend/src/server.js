import app from './app.js';
import logger from './config/logger.js';
import dotenv from 'dotenv';
import db from './config/db.js';
<<<<<<< HEAD
import { startSubscriptionCron } from '../modules/subscriptions/subscriptionCron.service.js';
=======
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

dotenv.config();

const PORT = process.env.PORT || 5000;

// Add generic catch-all for uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error(`UNHANDLED REJECTION: ${err.message}`);
    logger.error(err.stack);
    // Optional: close server before exiting
    process.exit(1);
});

app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
<<<<<<< HEAD
    // Start background jobs
    startSubscriptionCron();
});

=======
});
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4
