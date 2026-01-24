const twilio = require('twilio');

// Twilio configuration
const smsConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER
};

// Create Twilio client
const createTwilioClient = () => {
  if (!smsConfig.accountSid || !smsConfig.authToken) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    return null;
  }
  return twilio(smsConfig.accountSid, smsConfig.authToken);
};

// Verify SMS configuration
const verifySMSConfig = () => {
  const isConfigured = !!(
    smsConfig.accountSid &&
    smsConfig.authToken &&
    smsConfig.phoneNumber
  );

  if (isConfigured) {
    console.log('SMS configuration verified successfully');
  } else {
    console.warn('SMS configuration incomplete. Please check environment variables.');
  }

  return isConfigured;
};

// Format phone number (add country code if not present)
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If number doesn't start with country code, add default (Nigeria: +234)
  if (!cleaned.startsWith('234') && !cleaned.startsWith('+')) {
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '234' + cleaned;
  }

  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

// Validate phone number format
const isValidPhoneNumber = (phoneNumber) => {
  const formatted = formatPhoneNumber(phoneNumber);
  // Check if it's a valid format (starts with + and has 10-15 digits)
  return /^\+[1-9]\d{9,14}$/.test(formatted);
};

module.exports = {
  smsConfig,
  createTwilioClient,
  verifySMSConfig,
  formatPhoneNumber,
  isValidPhoneNumber
};