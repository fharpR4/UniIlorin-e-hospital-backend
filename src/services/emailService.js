const { createTransporter, getEmailOptions } = require('../config/email');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  // Load email template
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(
        __dirname,
        '../templates/email',
        `${templateName}.html`
      );
      const template = await fs.readFile(templatePath, 'utf-8');
      return template;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      throw new Error('Email template not found');
    }
  }

  // Replace placeholders in template
  replacePlaceholders(template, data) {
    let result = template;
    Object.keys(data).forEach((key) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, data[key]);
    });
    return result;
  }

  // Send email
  async sendEmail(to, subject, html) {
    try {
      const mailOptions = getEmailOptions(to, subject, html);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const template = await this.loadTemplate('welcome');
      const html = this.replacePlaceholders(template, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        year: new Date().getFullYear()
      });

      return await this.sendEmail(
        user.email,
        'Welcome to E-Hospital Management System',
        html
      );
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Send email verification
  async sendVerificationEmail(user, verificationToken) {
    try {
      const template = await this.loadTemplate('verification');
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      const html = this.replacePlaceholders(template, {
        firstName: user.firstName,
        verificationUrl: verificationUrl,
        year: new Date().getFullYear()
      });

      return await this.sendEmail(
        user.email,
        'Verify Your Email Address',
        html
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const template = await this.loadTemplate('passwordReset');
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const html = this.replacePlaceholders(template, {
        firstName: user.firstName,
        resetUrl: resetUrl,
        year: new Date().getFullYear()
      });

      return await this.sendEmail(
        user.email,
        'Password Reset Request',
        html
      );
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Send appointment confirmation email
  async sendAppointmentConfirmation(appointment, patient, doctor) {
    try {
      const template = await this.loadTemplate('appointmentConfirmation');
      
      const html = this.replacePlaceholders(template, {
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        doctorSpecialization: doctor.specialization,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: appointment.appointmentTime,
        appointmentType: appointment.type,
        appointmentNumber: appointment.appointmentNumber,
        consultationFee: `NGN ${appointment.consultationFee.toLocaleString()}`,
        appointmentsUrl: `${process.env.FRONTEND_URL}/appointments`,
        year: new Date().getFullYear()
      });

      return await this.sendEmail(
        patient.email,
        'Appointment Confirmation',
        html
      );
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
      throw error;
    }
  }

  // Send appointment reminder email
  async sendAppointmentReminder(appointment, patient, doctor) {
    try {
      const template = await this.loadTemplate('appointmentReminder');
      
      const html = this.replacePlaceholders(template, {
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        doctorSpecialization: doctor.specialization,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: appointment.appointmentTime,
        appointmentNumber: appointment.appointmentNumber,
        appointmentsUrl: `${process.env.FRONTEND_URL}/appointments`,
        year: new Date().getFullYear()
      });

      return await this.sendEmail(
        patient.email,
        'Appointment Reminder - Tomorrow',
        html
      );
    } catch (error) {
      console.error('Error sending appointment reminder email:', error);
      throw error;
    }
  }

  // Send lab results notification
  async sendLabResultsNotification(patient, record) {
    try {
      const template = await this.loadTemplate('labResults');
      
      const html = this.replacePlaceholders(template, {
        patientName: `${patient.firstName} ${patient.lastName}`,
        recordNumber: record.recordNumber,
        testDate: new Date(record.visitDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        recordsUrl: `${process.env.FRONTEND_URL}/medical-records`,
        year: new Date().getFullYear()
      });

      return await this.sendEmail(
        patient.email,
        'Lab Results Available',
        html
      );
    } catch (error) {
      console.error('Error sending lab results notification:', error);
      throw error;
    }
  }

  // Send appointment cancellation email
  async sendAppointmentCancellation(appointment, patient, doctor, reason) {
    try {
      const subject = 'Appointment Cancelled';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Appointment Cancelled</h2>
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          <p>Your appointment has been cancelled.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</p>
            <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>Please book a new appointment if needed.</p>
          <p>Thank you,<br>E-Hospital Team</p>
        </div>
      `;

      return await this.sendEmail(patient.email, subject, html);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      throw error;
    }
  }

  // Send prescription ready notification
  async sendPrescriptionReady(patient, prescription) {
    try {
      const subject = 'Prescription Ready';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">Prescription Ready</h2>
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          <p>Your prescription is ready for collection.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Prescription Number:</strong> ${prescription.prescriptionNumber}</p>
            <p><strong>Total Medications:</strong> ${prescription.medications.length}</p>
          </div>
          <p>Please collect your prescription from the pharmacy.</p>
          <p>Thank you,<br>E-Hospital Team</p>
        </div>
      `;

      return await this.sendEmail(patient.email, subject, html);
    } catch (error) {
      console.error('Error sending prescription ready email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();