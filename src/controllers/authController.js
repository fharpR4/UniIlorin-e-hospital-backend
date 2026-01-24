const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const { sendTokenResponse } = require('../config/jwt');
const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, createdResponse } = require('../utils/responseHandler');
const AuditLog = require('../models/AuditLog');

// Register user
exports.register = asyncHandler(async (req, res) => {
  const { role, ...userData } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return errorResponse(
      res,
      `This email (${userData.email}) is already registered. Please use a different email or try logging in.`,
      409
    );
  }

  // Validate role
  if (!['patient', 'doctor', 'admin'].includes(role)) {
    return errorResponse(res, 'Invalid role. Please select Patient, Doctor, or Admin.', 400);
  }

  // Prepare base user data
  const baseData = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    password: userData.password,
    role: role,
    gender: userData.gender,
    dateOfBirth: userData.dateOfBirth
  };

  let user;

  try {
    // Create user based on role with specific data
    if (role === 'patient') {
      const patientData = {
        ...baseData,
        bloodGroup: userData.bloodGroup,
        genotype: userData.genotype,
        emergencyContact: {
          name: userData.emergencyContact?.name,
          relationship: userData.emergencyContact?.relationship,
          phone: userData.emergencyContact?.phone
        }
      };

      // Add optional fields if they exist
      if (userData.emergencyContact?.email) {
        patientData.emergencyContact.email = userData.emergencyContact.email;
      }

      if (userData.height?.value) {
        patientData.height = {
          value: userData.height.value,
          unit: userData.height.unit || 'cm'
        };
      }

      if (userData.weight?.value) {
        patientData.weight = {
          value: userData.weight.value,
          unit: userData.weight.unit || 'kg'
        };
      }

      user = await Patient.create(patientData);
      
    } else if (role === 'doctor') {
      const doctorData = {
        ...baseData,
        specialization: userData.specialization,
        licenseNumber: userData.licenseNumber,
        department: userData.department,
        consultationFee: userData.consultationFee
      };
      user = await Doctor.create(doctorData);
    } else if (role === 'admin') {
      user = await Admin.create(baseData);
    }
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, `Validation Error: ${messages.join(', ')}`, 400);
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return errorResponse(res, `A user with ${field} '${value}' already exists`, 409);
    }
    console.error('Registration error:', error);
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  }

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email using YOUR notification service
  try {
    await notificationService.sendEmailVerification(user, verificationToken);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Continue even if email fails - don't break registration
  }

  // Send welcome email using YOUR notification service
  try {
    await notificationService.sendWelcomeEmail(user);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Continue even if email fails
  }

  // Log registration
  await AuditLog.logActivity({
    user: user._id,
    action: 'register',
    resourceType: 'User',
    resourceId: user._id,
    description: `User registered successfully as ${role}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  sendTokenResponse(user, 201, res);
});

// Resend verification email
exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  if (user.isEmailVerified) {
    return errorResponse(res, 'Email already verified', 400);
  }

  // Generate new token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send email using YOUR notification service
  try {
    await notificationService.sendEmailVerification(user, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return errorResponse(res, 'Failed to send verification email. Please try again.', 500);
  }

  successResponse(res, null, 'Verification email sent successfully');
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Please provide email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    await AuditLog.logActivity({
      action: 'login',
      resourceType: 'User',
      description: `Failed login attempt for non-existent email: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'failure'
    });

    return errorResponse(res, 'Invalid email or password. Please check your credentials.', 401);
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    await AuditLog.logActivity({
      user: user._id,
      action: 'login',
      resourceType: 'User',
      resourceId: user._id,
      description: 'Failed login attempt - incorrect password',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'failure'
    });

    return errorResponse(res, 'Invalid email or password. Please check your credentials.', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Your account has been deactivated. Please contact support at info@ehospital.unilorin.edu.ng', 403);
  }

  // Update last login
  await user.updateLastLogin();

  // Send login notification email using YOUR notification service
  try {
    await notificationService.sendLoginNotification(
      user,
      req.ip,
      req.headers['user-agent']
    );
  } catch (emailError) {
    console.error('Failed to send login notification:', emailError);
    // Continue even if email fails
  }

  // Log successful login
  await AuditLog.logActivity({
    user: user._id,
    action: 'login',
    resourceType: 'User',
    resourceId: user._id,
    description: 'User logged in successfully',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  sendTokenResponse(user, 200, res);
});

// Get current user
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  successResponse(res, user, 'User profile retrieved');
});

// Logout user
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'logout',
    resourceType: 'User',
    resourceId: req.user._id,
    description: 'User logged out',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });
  
  successResponse(res, null, 'Logged out successfully');
});

// Verify email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return errorResponse(res, 'Verification token is required', 400);
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return errorResponse(res, 'Invalid or expired verification token', 400);
  }
  
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });
  
  await AuditLog.logActivity({
    user: user._id,
    action: 'email-verification',
    resourceType: 'User',
    resourceId: user._id,
    description: 'Email verified successfully',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });
  
  successResponse(res, null, 'Email verified successfully');
});

// Forgot password - FIXED: Uses correct method name and YOUR notification service
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return errorResponse(res, 'Email is required', 400);
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    // For security, don't reveal if user exists
    return successResponse(res, null, 'If your email is registered, you will receive a password reset link');
  }
  
  // FIXED: Changed from generatePasswordResetToken() to generateResetPasswordToken()
  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  
  try {
    // Send password reset email using YOUR notification service
    await notificationService.sendPasswordResetEmail(user, resetToken);
    
    await AuditLog.logActivity({
      user: user._id,
      action: 'password-reset-request',
      resourceType: 'User',
      resourceId: user._id,
      description: 'Password reset requested - email sent',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });
    
    return successResponse(res, null, 'Password reset email sent');
    
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    
    // Log the failure
    await AuditLog.logActivity({
      user: user._id,
      action: 'password-reset-request',
      resourceType: 'User',
      resourceId: user._id,
      description: `Password reset requested - email failed: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'failure'
    });
    
    // Clear tokens since email failed
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return errorResponse(res, 'Failed to send password reset email. Please try again later or contact support.', 500);
  }
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  if (!token) {
    return errorResponse(res, 'Reset token is required', 400);
  }
  
  if (!password || password.length < 8) {
    return errorResponse(res, 'Password must be at least 8 characters long', 400);
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return errorResponse(res, 'Invalid or expired reset token', 400);
  }
  
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  await AuditLog.logActivity({
    user: user._id,
    action: 'password-reset',
    resourceType: 'User',
    resourceId: user._id,
    description: 'Password reset successfully',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });
  
  sendTokenResponse(user, 200, res);
});

// Update password
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Please provide current and new password', 400);
  }
  
  if (newPassword.length < 8) {
    return errorResponse(res, 'New password must be at least 8 characters long', 400);
  }
  
  const user = await User.findById(req.user._id).select('+password');
  
  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    return errorResponse(res, 'Current password is incorrect', 401);
  }
  
  user.password = newPassword;
  await user.save();
  
  await AuditLog.logActivity({
    user: user._id,
    action: 'password-update',
    resourceType: 'User',
    resourceId: user._id,
    description: 'Password updated successfully',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });
  
  sendTokenResponse(user, 200, res);
});

// Update profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address
  };

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  
  // Log profile update
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'profile-update',
    resourceType: 'User',
    resourceId: req.user._id,
    description: 'User profile updated',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  successResponse(res, user, 'Profile updated successfully');
});