const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  // Order placed - Customer email
  orderPlacedCustomer: (orderData) => ({
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c7a2c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 10px 20px; background: #2c7a2c; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm to Table</h1>
            <h2>Order Confirmation</h2>
          </div>
          
          <div class="content">
            <p>Dear ${orderData.customerName},</p>
            <p>Thank you for your order! We've received your order and it's being processed.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
              <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
              <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
            </div>
            
            <div class="order-details">
              <h3>Order Items</h3>
              ${orderData.items.map(item => `
                <p><strong>${item.name}</strong> - ${item.quantity} ${item.unit} × ₹${item.price} = ₹${item.total}</p>
              `).join('')}
            </div>
            
            <div class="order-details">
              <h3>Farmer Information</h3>
              <p><strong>Farm:</strong> ${orderData.farmerName}</p>
              <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
            </div>
            
            <p>You'll receive another email when your order is out for delivery.</p>
            <p>Thank you for supporting local farmers!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farm to Table. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Order placed - Farmer email
  orderPlacedFarmer: (orderData) => ({
    subject: `New Order Received - ${orderData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c7a2c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm to Table</h1>
            <h2>New Order Received!</h2>
          </div>
          
          <div class="content">
            <div class="urgent">
              <p><strong>Action Required:</strong> You have received a new order that needs to be processed.</p>
            </div>
            
            <p>Dear ${orderData.farmerName},</p>
            <p>You have received a new order from a customer. Please review the details below and prepare the order for delivery.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
              <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
              <p><strong>Customer Name:</strong> ${orderData.customerName}</p>
              <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
            </div>
            
            <div class="order-details">
              <h3>Order Items</h3>
              ${orderData.items.map(item => `
                <p><strong>${item.name}</strong> - ${item.quantity} ${item.unit} × ₹${item.price} = ₹${item.total}</p>
              `).join('')}
            </div>
            
            <p>Please prepare this order for delivery as soon as possible. Update the order status in your dashboard when ready.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farm to Table. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Order status update - Customer email
  orderStatusUpdate: (orderData) => ({
    subject: `Order Status Update - ${orderData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c7a2c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-update { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .status-badge { display: inline-block; padding: 5px 10px; background: #2c7a2c; color: white; border-radius: 3px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm to Table</h1>
            <h2>Order Status Update</h2>
          </div>
          
          <div class="content">
            <p>Dear ${orderData.customerName},</p>
            <p>Your order status has been updated.</p>
            
            <div class="status-update">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>New Status:</strong> <span class="status-badge">${orderData.status.toUpperCase()}</span></p>
              <p><strong>Updated On:</strong> ${new Date(orderData.updatedAt).toLocaleDateString()}</p>
            </div>
            
            ${orderData.statusMessage ? `
              <div class="status-update">
                <h3>Message</h3>
                <p>${orderData.statusMessage}</p>
              </div>
            ` : ''}
            
            <p>You can track your order status in your Farm to Table account.</p>
            <p>Thank you for your patience!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farm to Table. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Payment success - Customer email
  paymentSuccess: (paymentData) => ({
    subject: `Payment Successful - Order ${paymentData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .payment-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .success-badge { display: inline-block; padding: 5px 10px; background: #28a745; color: white; border-radius: 3px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm to Table</h1>
            <h2>Payment Successful!</h2>
          </div>
          
          <div class="content">
            <p>Dear ${paymentData.customerName},</p>
            <p>Your payment has been successfully processed.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Order Number:</strong> ${paymentData.orderNumber}</p>
              <p><strong>Payment Status:</strong> <span class="success-badge">SUCCESS</span></p>
              <p><strong>Amount Paid:</strong> ₹${paymentData.amount}</p>
              <p><strong>Payment Method:</strong> Online Payment</p>
              <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
              <p><strong>Payment Date:</strong> ${new Date(paymentData.paymentDate).toLocaleDateString()}</p>
            </div>
            
            <p>Your order is now being processed. You'll receive updates as your order progresses.</p>
            <p>Thank you for your payment!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farm to Table. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Payment failure - Customer email
  paymentFailure: (paymentData) => ({
    subject: `Payment Failed - Order ${paymentData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .payment-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .error-badge { display: inline-block; padding: 5px 10px; background: #dc3545; color: white; border-radius: 3px; font-weight: bold; }
          .retry-section { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm to Table</h1>
            <h2>Payment Failed</h2>
          </div>
          
          <div class="content">
            <p>Dear ${paymentData.customerName},</p>
            <p>We're sorry, but your payment could not be processed.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Order Number:</strong> ${paymentData.orderNumber}</p>
              <p><strong>Payment Status:</strong> <span class="error-badge">FAILED</span></p>
              <p><strong>Attempted Amount:</strong> ₹${paymentData.amount}</p>
              <p><strong>Payment Method:</strong> Online Payment</p>
              <p><strong>Failure Date:</strong> ${new Date(paymentData.failureDate).toLocaleDateString()}</p>
            </div>
            
            <div class="retry-section">
              <h3>What to do next?</h3>
              <p>Your order has been saved, but payment is pending. You can:</p>
              <ul>
                <li>Try payment again from your order history</li>
                <li>Choose a different payment method</li>
                <li>Contact our support team if you continue to face issues</li>
              </ul>
            </div>
            
            <p>If you believe this is an error, please contact our support team immediately.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farm to Table. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Subscription triggered - Customer email
  subscriptionTriggered: (subscriptionData) => ({
    subject: `Subscription Order Created - ${subscriptionData.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Order</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c7a2c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .subscription-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .subscription-badge { display: inline-block; padding: 5px 10px; background: #2c7a2c; color: white; border-radius: 3px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm to Table</h1>
            <h2>Subscription Order Created</h2>
          </div>
          
          <div class="content">
            <p>Dear ${subscriptionData.customerName},</p>
            <p>Your subscription has been processed and a new order has been created automatically.</p>
            
            <div class="subscription-details">
              <h3>Subscription Details</h3>
              <p><strong>Order Number:</strong> ${subscriptionData.orderNumber}</p>
              <p><strong>Subscription Type:</strong> <span class="subscription-badge">${subscriptionData.frequency}</span></p>
              <p><strong>Product:</strong> ${subscriptionData.productName}</p>
              <p><strong>Quantity:</strong> ${subscriptionData.quantity} ${subscriptionData.unit}</p>
              <p><strong>Order Amount:</strong> ₹${subscriptionData.amount}</p>
              <p><strong>Next Delivery:</strong> ${new Date(subscriptionData.nextDelivery).toLocaleDateString()}</p>
              <p><strong>Farmer:</strong> ${subscriptionData.farmerName}</p>
            </div>
            
            <p>This order was created automatically based on your subscription settings. You can manage your subscription preferences in your account.</p>
            <p>Thank you for being a loyal customer!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farm to Table. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Main email sending function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Farm to Table" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    logger.error(`Email sending failed to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Send email with template
const sendEmailTemplate = async (to, templateName, templateData) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(templateData);
    return await sendEmail(to, subject, html);
    
  } catch (error) {
    logger.error(`Error sending email template '${templateName}' to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation emails
const sendOrderConfirmationEmails = async (orderData) => {
  const results = {
    customer: null,
    farmer: null
  };

  // Send to customer
  if (orderData.customerEmail) {
    results.customer = await sendEmailTemplate('orderPlacedCustomer', orderData);
  }

  // Send to farmer
  if (orderData.farmerEmail) {
    results.farmer = await sendEmailTemplate('orderPlacedFarmer', orderData);
  }

  return results;
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (orderData) => {
  if (orderData.customerEmail) {
    return await sendEmailTemplate('orderStatusUpdate', orderData);
  }
  return { success: false, error: 'Customer email not provided' };
};

// Send payment success email
const sendPaymentSuccessEmail = async (paymentData) => {
  if (paymentData.customerEmail) {
    return await sendEmailTemplate('paymentSuccess', paymentData);
  }
  return { success: false, error: 'Customer email not provided' };
};

// Send payment failure email
const sendPaymentFailureEmail = async (paymentData) => {
  if (paymentData.customerEmail) {
    return await sendEmailTemplate('paymentFailure', paymentData);
  }
  return { success: false, error: 'Customer email not provided' };
};

// Send subscription triggered email
const sendSubscriptionTriggeredEmail = async (subscriptionData) => {
  if (subscriptionData.customerEmail) {
    return await sendEmailTemplate('subscriptionTriggered', subscriptionData);
  }
  return { success: false, error: 'Customer email not provided' };
};

// Test email function (for development/testing)
const sendTestEmail = async (to) => {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body>
      <h1>Test Email from Farm to Table</h1>
      <p>This is a test email to verify the email service is working correctly.</p>
      <p>Sent at: ${new Date().toLocaleString()}</p>
    </body>
    </html>
  `;
  
  return await sendEmail(to, 'Test Email - Farm to Table', testHtml);
};

module.exports = {
  sendEmail,
  sendEmailTemplate,
  sendOrderConfirmationEmails,
  sendOrderStatusUpdateEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendSubscriptionTriggeredEmail,
  sendTestEmail
};
