import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../src/config/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Replace placeholders in HTML template
 */
const compileTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, '../modules/notifications/templates', `${templateName}.html`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found`);
  }

  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, value);
  }
  return html;
};

/**
 * Send an email asynchronously
 */
export const sendEmail = async ({ to, subject, templateName, data }) => {
  try {
    const htmlContent = compileTemplate(templateName, data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Farm To Table" <noreply@farmtotable.com>',
      to,
      subject,
      html: htmlContent
    };

    // We do not await this in the main thread if we want it to be truly non-blocking,
    // but typically we await the transporter.sendMail and catch errors so we can log them.
    // To make it non-blocking from the caller's perspective, the caller should not await `sendEmail`.
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    // Depending on requirements, might want to retry. For now, log the failure.
  }
};
