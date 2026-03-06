import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Standardizing to gmail or any SMTP provider; user configures in env
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Farm To Table" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Error sending email to ${to}: ${error.message}`);
        return false;
    }
};
