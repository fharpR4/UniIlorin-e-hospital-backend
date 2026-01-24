// User roles
const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

// Appointment statuses
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked-in',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

// Appointment types
const APPOINTMENT_TYPES = {
  CONSULTATION: 'consultation',
  FOLLOW_UP: 'follow-up',
  EMERGENCY: 'emergency',
  ROUTINE_CHECKUP: 'routine-checkup',
  PROCEDURE: 'procedure',
  SURGERY: 'surgery'
};

// Appointment priorities
const APPOINTMENT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EMERGENCY: 'emergency'
};

// Prescription status
const PRESCRIPTION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Medication forms
const MEDICATION_FORMS = {
  TABLET: 'tablet',
  CAPSULE: 'capsule',
  SYRUP: 'syrup',
  INJECTION: 'injection',
  CREAM: 'cream',
  OINTMENT: 'ointment',
  DROPS: 'drops',
  INHALER: 'inhaler',
  PATCH: 'patch'
};

// Notification types
const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  BOTH: 'both',
  IN_APP: 'in-app'
};

// Notification categories
const NOTIFICATION_CATEGORIES = {
  APPOINTMENT_CONFIRMATION: 'appointment-confirmation',
  APPOINTMENT_REMINDER: 'appointment-reminder',
  APPOINTMENT_CANCELLATION: 'appointment-cancellation',
  APPOINTMENT_RESCHEDULED: 'appointment-rescheduled',
  LAB_RESULTS_READY: 'lab-results-ready',
  PRESCRIPTION_READY: 'prescription-ready',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  REGISTRATION_WELCOME: 'registration-welcome',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  SYSTEM_ALERT: 'system-alert',
  GENERAL: 'general'
};

// Blood groups
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Genotypes
const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'];

// Gender options
const GENDERS = ['male', 'female', 'other'];

// Marital status options
const MARITAL_STATUS = ['single', 'married', 'divorced', 'widowed'];

// Medical specializations
const SPECIALIZATIONS = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Obstetrics and Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology',
  'Anesthesiology',
  'Emergency Medicine',
  'Pathology'
];

// Admin departments
const ADMIN_DEPARTMENTS = [
  'IT',
  'Administration',
  'Finance',
  'Human Resources',
  'Operations',
  'Medical Records',
  'Customer Service'
];

// Admin access levels
const ACCESS_LEVELS = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff'
};

// Payment methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  INSURANCE: 'insurance',
  ONLINE: 'online'
};

// Days of the week
const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// Audit log actions
const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password-reset',
  PROFILE_UPDATE: 'profile-update',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  APPROVE: 'approve',
  REJECT: 'reject',
  CANCEL: 'cancel'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  DUPLICATE_ENTRY: 'Entry already exists',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  ACCOUNT_INACTIVE: 'Your account has been deactivated',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token'
};

// Success messages
const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful',
  REGISTER: 'Registration successful',
  EMAIL_SENT: 'Email sent successfully',
  SMS_SENT: 'SMS sent successfully',
  PASSWORD_RESET: 'Password reset successfully',
  EMAIL_VERIFIED: 'Email verified successfully'
};

// Regex patterns
const REGEX_PATTERNS = {
  EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/
};

// Date formats
const DATE_FORMATS = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY hh:mm A'
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAILY: 86400 // 24 hours
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// File upload limits
const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  ALLOWED_ALL_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
};

module.exports = {
  USER_ROLES,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  APPOINTMENT_PRIORITIES,
  PRESCRIPTION_STATUS,
  MEDICATION_FORMS,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  BLOOD_GROUPS,
  GENOTYPES,
  GENDERS,
  MARITAL_STATUS,
  SPECIALIZATIONS,
  ADMIN_DEPARTMENTS,
  ACCESS_LEVELS,
  PAYMENT_METHODS,
  DAYS_OF_WEEK,
  AUDIT_ACTIONS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
  DATE_FORMATS,
  CACHE_TTL,
  PAGINATION,
  FILE_UPLOAD
};