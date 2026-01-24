const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates (for development)
  }
};

// Create transporter
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    console.log('✓ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('✗ Error creating email transporter:', error.message);
    throw error;
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✓ Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('✗ Email configuration error:', error.message);
    console.log('Note: Make sure EMAIL_USER and EMAIL_PASSWORD are set in .env file');
    return false;
  }
};

// Email template options
const getEmailOptions = (to, subject, html) => {
  return {
    from: process.env.EMAIL_FROM || 'UniIlorin E-Hospital <noreply@ehospital.com>',
    to,
    subject,
    html
  };
};

module.exports = {
  emailConfig,
  createTransporter,
  verifyEmailConfig,
  getEmailOptions
};