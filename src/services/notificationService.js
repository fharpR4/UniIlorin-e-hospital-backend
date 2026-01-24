const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error.message);
    } else {
      console.log('Email transporter is ready');
    }
  });
} catch (error) {
  console.error('Failed to create email transporter:', error.message);
  transporter = null;
}

// Helper function to load and replace template variables
const loadTemplate = async (templateName, variables) => {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key] || '');
    });
    
    return template;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Template ${templateName}.html not found, using fallback`);
      
      // Create a basic fallback template
      let fallback = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${variables.subject || 'Notification from UniIlorin E-Hospital'}</h2>
          <p>Hello ${variables.firstName || variables.user?.firstName || 'User'},</p>
      `;
      
      if (variables.message) {
        fallback += `<p>${variables.message}</p>`;
      }
      
      if (variables.verificationUrl) {
        fallback += `<p><a href="${variables.verificationUrl}">Click here to verify your email</a></p>`;
      }
      
      if (variables.resetUrl) {
        fallback += `<p><a href="${variables.resetUrl}">Click here to reset your password</a></p>`;
      }
      
      fallback += `
          <hr>
          <p>Best regards,<br>UniIlorin E-Hospital Team</p>
          <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} UniIlorin E-Hospital</p>
        </body>
        </html>
      `;
      
      return fallback;
    }
    throw error;
  }
};

// Send email verification
const sendEmailVerification = async (user, token) => {
  if (!transporter) {
    console.error('Email transporter not available');
    throw new Error('Email service not configured');
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  let templateName = '';
  let subject = '';
  
  // Determine template based on role
  if (user.role === 'patient') {
    templateName = 'patient-verification';
    subject = 'Verify Your Patient Account - UniIlorin E-Hospital';
  } else if (user.role === 'doctor') {
    templateName = 'doctor-verification';
    subject = 'Activate Your Doctor Account - UniIlorin E-Hospital';
  } else {
    templateName = 'admin-verification';
    subject = 'Verify Administrator Account - UniIlorin E-Hospital';
  }

  try {
    // Prepare variables for the template
    const templateVariables = {
      firstName: user.firstName,
      lastName: user.lastName,
      verificationUrl: verificationUrl,
      year: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate(templateName, templateVariables);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send verification email to ${user.email}:`, error.message);
    
    // Create fallback email
    try {
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <div style="background: #1976D2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Email Verification</h1>
            </div>
            <div style="padding: 30px;">
              <h2>Hello ${user.firstName} ${user.lastName},</h2>
              <p>Please verify your email address to activate your ${user.role} account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p>Or copy this URL: ${verificationUrl}</p>
              <p><strong>This link expires in 24 hours.</strong></p>
              <p>Best regards,<br>UniIlorin E-Hospital Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: fallbackHtml
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`Fallback verification email sent to ${user.email}`);
      return info;
    } catch (fallbackError) {
      console.error(`Fallback also failed for ${user.email}:`, fallbackError.message);
      throw error;
    }
  }
};

// Send login notification
const sendLoginNotification = async (user, ipAddress, userAgent) => {
  if (!transporter) {
    console.error('Email transporter not available');
    return;
  }

  const deviceInfo = userAgent || 'Unknown device';
  const loginTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Lagos',
    timeZoneName: 'long'
  });

  try {
    // Try to load login-notification template
    const templateVariables = {
      firstName: user.firstName,
      loginTime: loginTime,
      ipAddress: ipAddress || 'Unknown',
      userAgent: deviceInfo,
      deviceInfo: deviceInfo, // Some templates might use deviceInfo instead of userAgent
      accountType: user.role.charAt(0).toUpperCase() + user.role.slice(1)
    };

    const htmlContent = await loadTemplate('login-notification', templateVariables);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Security Alert: New Login to Your E-Hospital Account',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Login notification sent to ${user.email}`);
    return info;
  } catch (error) {
    console.error(`Failed to send login notification to ${user.email}:`, error.message);
    
    // Create fallback login notification
    try {
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h2 style="color: #E65100;">Security Alert: New Login Detected</h2>
            <p>Hello ${user.firstName} ${user.lastName},</p>
            <p>A new login was detected on your account:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Login Time:</strong> ${loginTime}</p>
              <p><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
              <p><strong>Device/Browser:</strong> ${deviceInfo}</p>
              <p><strong>Account Type:</strong> ${user.role}</p>
            </div>
            <p>If this wasn't you, please change your password immediately.</p>
            <p>Best regards,<br>UniIlorin E-Hospital Security Team</p>
          </div>
        </body>
        </html>
      `;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Security Alert: New Login to Your E-Hospital Account',
        html: fallbackHtml
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Fallback login notification sent to ${user.email}`);
    } catch (fallbackError) {
      console.error(`Fallback login notification also failed:`, fallbackError.message);
    }
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  if (!transporter) {
    console.error('Email transporter not available');
    return;
  }

  try {
    const templateVariables = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      year: new Date().getFullYear(),
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
    };

    const htmlContent = await loadTemplate('welcome', templateVariables);

    const subject = user.role === 'doctor' 
      ? `Welcome Dr. ${user.lastName} - UniIlorin E-Hospital` 
      : `Welcome ${user.firstName} - UniIlorin E-Hospital`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
    return info;
  } catch (error) {
    console.error(`Failed to send welcome email to ${user.email}:`, error.message);
    
    // Create fallback welcome email
    try {
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Welcome to UniIlorin E-Hospital</h1>
            </div>
            <div style="padding: 30px;">
              <h2>Hello ${user.firstName} ${user.lastName},</h2>
              <p>Welcome to UniIlorin E-Hospital Management System!</p>
              <p>Your ${user.role} account has been successfully created with email: ${user.email}</p>
              <p>You can now login and start using our services.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #1976D2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Login to Your Account
                </a>
              </div>
              <p>Best regards,<br>UniIlorin E-Hospital Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Welcome to UniIlorin E-Hospital`,
        html: fallbackHtml
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Fallback welcome email sent to ${user.email}`);
    } catch (fallbackError) {
      console.error(`Fallback welcome email also failed:`, fallbackError.message);
    }
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  if (!transporter) {
    console.error('Email transporter not available');
    throw new Error('Email service not configured');
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  try {
    // Prepare variables for the password-reset template
    const templateVariables = {
      firstName: user.firstName,
      lastName: user.lastName,
      resetUrl: resetUrl,
      resetToken: resetToken,
      year: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('password-reset', templateVariables);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - UniIlorin E-Hospital',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send password reset email to ${user.email}:`, error.message);
    
    // Create fallback password reset email
    try {
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #1976D2;">
            <h2 style="color: #1976D2;">Password Reset Request</h2>
            <p>Hello ${user.firstName} ${user.lastName},</p>
            <p>You requested to reset your password for your UniIlorin E-Hospital account.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Reset Token:</strong></p>
              <code style="display: block; background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin: 10px 0; word-break: break-all;">
                ${resetToken}
              </code>
            </div>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="color: #1976D2; word-break: break-all;">${resetUrl}</a></p>
            <p><strong>Note:</strong> This token expires in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">
            <p>Best regards,<br>UniIlorin E-Hospital Team</p>
            <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} UniIlorin E-Hospital</p>
          </div>
        </body>
        </html>
      `;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request - UniIlorin E-Hospital',
        html: fallbackHtml
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`Fallback password reset email sent to ${user.email}`);
      return info;
    } catch (finalError) {
      console.error(`Fallback attempt failed for ${user.email}:`, finalError.message);
      throw error;
    }
  }
};

// Additional email functions that might be needed
const sendAppointmentReminder = async (patient, doctor, appointment) => {
  if (!transporter) {
    console.error('Email transporter not available');
    return;
  }

  try {
    const templateVariables = {
      patientName: patient.firstName,
      doctorName: `Dr. ${doctor.lastName}`,
      doctorSpecialization: doctor.specialization,
      appointmentDate: new Date(appointment.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      appointmentTime: new Date(appointment.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      appointmentNumber: appointment._id.toString().slice(-8).toUpperCase(),
      appointmentsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/appointments`,
      year: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('appointmentReminder', templateVariables);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
      to: patient.email,
      subject: 'Appointment Reminder - UniIlorin E-Hospital',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Appointment reminder sent to ${patient.email}`);
    return info;
  } catch (error) {
    console.error(`Failed to send appointment reminder to ${patient.email}:`, error.message);
  }
};

const sendLabResultsNotification = async (patient, record) => {
  if (!transporter) {
    console.error('Email transporter not available');
    return;
  }

  try {
    const templateVariables = {
      patientName: patient.firstName,
      recordNumber: record._id.toString().slice(-8).toUpperCase(),
      testDate: new Date(record.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      recordsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/medical-records`,
      year: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('labResults', templateVariables);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"UniIlorin E-Hospital" <${process.env.EMAIL_USER}>`,
      to: patient.email,
      subject: 'Lab Results Available - UniIlorin E-Hospital',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Lab results notification sent to ${patient.email}`);
    return info;
  } catch (error) {
    console.error(`Failed to send lab results notification to ${patient.email}:`, error.message);
  }
};

module.exports = {
  sendEmailVerification,
  sendLoginNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAppointmentReminder,
  sendLabResultsNotification
};