import logger from '../config/logger.js';

// Setup Nodemailer here later
// const transporter = nodemailer.createTransport({ ... });

export const sendOrderConfirmation = async (consumerEmail, orderDetails) => {
    // Mock sending email
    logger.info(`[Notification] Order confirmation sent to ${consumerEmail} for Order #${orderDetails.order_number}`);
    // await transporter.sendMail({ to: consumerEmail, subject: 'Order Confirmed', ... });
};

export const notifyFarmerNewOrder = async (farmerEmail, orderDetails) => {
    logger.info(`[Notification] New order notification sent to farmer ${farmerEmail} for Order #${orderDetails.order_number}`);
    // await transporter.sendMail({ to: farmerEmail, subject: 'New Order Received', ... });
};

export const sendFarmerApprovalNotice = async (farmerEmail) => {
    logger.info(`[Notification] Approval notice sent to ${farmerEmail}`);
};
