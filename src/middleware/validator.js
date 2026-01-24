const Joi = require('joi');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

// Registration validation schema
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])')
  ).messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
    'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
    'any.required': 'Phone number is required'
  }),
  role: Joi.string().valid('patient', 'doctor', 'admin').required().messages({
    'any.only': 'Role must be either patient, doctor, or admin',
    'any.required': 'Role is required'
  }),
  dateOfBirth: Joi.date().max('now').when('role', {
    is: 'patient',
    then: Joi.required()
  }).messages({
    'date.max': 'Date of birth cannot be in the future',
    'any.required': 'Date of birth is required for patients'
  }),
  gender: Joi.string().valid('male', 'female', 'other').when('role', {
    is: 'patient',
    then: Joi.required()
  }).messages({
    'any.only': 'Gender must be male, female, or other',
    'any.required': 'Gender is required for patients'
  }),
  address: Joi.string().max(200),
  specialization: Joi.string().when('role', {
    is: 'doctor',
    then: Joi.required()
  }).messages({
    'any.required': 'Specialization is required for doctors'
  }),
  licenseNumber: Joi.string().when('role', {
    is: 'doctor',
    then: Joi.required()
  }).messages({
    'any.required': 'License number is required for doctors'
  }),
  department: Joi.string().when('role', {
    is: 'doctor',
    then: Joi.required()
  }).messages({
    'any.required': 'Department is required for doctors'
  })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Forgot password validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().min(8).required().pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])')
  ).messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  })
});

// Update password validation schema
const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(8).required().pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])')
  ).messages({
    'string.min': 'New password must be at least 8 characters',
    'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'New password is required'
  })
});

// Update profile validation schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).messages({
    'string.pattern.base': 'Please provide a valid phone number (10-15 digits)'
  }),
  address: Joi.string().max(200).messages({
    'string.max': 'Address cannot exceed 200 characters'
  }),
  dateOfBirth: Joi.date().max('now').messages({
    'date.max': 'Date of birth cannot be in the future'
  }),
  gender: Joi.string().valid('male', 'female', 'other').messages({
    'any.only': 'Gender must be male, female, or other'
  })
});

// Email verification validation schema
const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Verification token is required'
  })
});

// Appointment validation schema
const appointmentSchema = Joi.object({
  doctorId: Joi.string().required().messages({
    'any.required': 'Doctor selection is required'
  }),
  appointmentDate: Joi.date().min('now').required().messages({
    'date.min': 'Appointment date must be in the future',
    'any.required': 'Appointment date is required'
  }),
  appointmentTime: Joi.string().required().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
    'string.pattern.base': 'Please provide a valid time in HH:MM format',
    'any.required': 'Appointment time is required'
  }),
  type: Joi.string().valid('consultation', 'follow-up', 'emergency', 'checkup').required().messages({
    'any.only': 'Appointment type must be consultation, follow-up, emergency, or checkup',
    'any.required': 'Appointment type is required'
  }),
  reason: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Reason must be at least 10 characters',
    'string.max': 'Reason cannot exceed 500 characters',
    'any.required': 'Reason for appointment is required'
  }),
  symptoms: Joi.string().max(1000).optional().messages({
    'string.max': 'Symptoms description cannot exceed 1000 characters'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  })
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  appointmentSchema
};