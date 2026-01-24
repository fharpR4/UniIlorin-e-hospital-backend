const crypto = require('crypto');
const moment = require('moment');

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

// Hash string
const hashString = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};

// Format phone number
const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (Nigeria: +234)
  if (!cleaned.startsWith('234') && !cleaned.startsWith('+')) {
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

// Validate email
const isValidEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

// Validate phone
const isValidPhone = (phone) => {
  const formatted = formatPhoneNumber(phone);
  return /^\+[1-9]\d{9,14}$/.test(formatted);
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

// Get date range
const getDateRange = (period) => {
  const endDate = moment().endOf('day');
  let startDate;
  
  switch (period) {
    case 'today':
      startDate = moment().startOf('day');
      break;
    case 'yesterday':
      startDate = moment().subtract(1, 'days').startOf('day');
      break;
    case 'week':
      startDate = moment().subtract(7, 'days').startOf('day');
      break;
    case 'month':
      startDate = moment().subtract(30, 'days').startOf('day');
      break;
    case 'year':
      startDate = moment().subtract(365, 'days').startOf('day');
      break;
    default:
      startDate = moment().startOf('day');
  }
  
  return { startDate: startDate.toDate(), endDate: endDate.toDate() };
};

// Calculate age
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Calculate BMI
const calculateBMI = (weight, height, weightUnit = 'kg', heightUnit = 'cm') => {
  let weightKg = weight;
  let heightM = height;
  
  // Convert to metric if needed
  if (weightUnit === 'lbs') {
    weightKg = weight * 0.453592;
  }
  
  if (heightUnit === 'ft') {
    heightM = height * 0.3048;
  } else if (heightUnit === 'cm') {
    heightM = height / 100;
  }
  
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
};

// Get BMI category
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Slugify string
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// Paginate results
const paginate = (page = 1, limit = 10) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const skip = (pageNum - 1) * limitNum;
  
  return {
    skip,
    limit: limitNum,
    page: pageNum
  };
};

// Build pagination metadata
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Generate appointment slots
const generateTimeSlots = (startTime, endTime, duration = 30) => {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentTime = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;
  
  while (currentTime + duration <= endTimeMinutes) {
    const hour = Math.floor(currentTime / 60);
    const minute = currentTime % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    currentTime += duration;
  }
  
  return slots;
};

// Get day name
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

// Check if date is in past
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

// Check if date is today
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
};

// Format currency
const formatCurrency = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Mask sensitive data
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
};

const maskPhone = (phone) => {
  return phone.substring(0, 4) + '*'.repeat(phone.length - 7) + phone.substring(phone.length - 3);
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined/null values from object
const removeEmpty = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null && value !== '')
  );
};

// Get random element from array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Sleep/delay function
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry async function
const retryAsync = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay);
    }
  }
};

// Group array by key
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

// Convert object to query string
const toQueryString = (obj) => {
  return Object.entries(obj)
    .filter(([_, value]) => value != null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

module.exports = {
  generateRandomString,
  generateOTP,
  hashString,
  formatPhoneNumber,
  isValidEmail,
  isValidPhone,
  formatDate,
  getDateRange,
  calculateAge,
  calculateBMI,
  getBMICategory,
  sanitizeInput,
  slugify,
  paginate,
  buildPaginationMeta,
  generateTimeSlots,
  getDayName,
  isPastDate,
  isToday,
  formatCurrency,
  maskEmail,
  maskPhone,
  deepClone,
  removeEmpty,
  getRandomElement,
  shuffleArray,
  sleep,
  retryAsync,
  groupBy,
  toQueryString
};