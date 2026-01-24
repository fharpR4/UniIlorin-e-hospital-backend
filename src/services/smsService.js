const { createTwilioClient, formatPhoneNumber, isValidPhoneNumber } = require('../config/sms');
const fs = require('fs').promises;
const path = require('path');

class SMSService {
  constructor() {
    this.client = createTwilioClient();
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  // Load SMS template
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(
        __dirname,
        '../templates/sms',
        `${templateName}.txt`
      );
      const template = await fs.readFile(templatePath, 'utf-8');
      return template;
    } catch (error) {
      console.error(`Error loading SMS template ${templateName}:`, error);
      return null;
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

  // Send SMS
  async sendSMS(to, message) {
    try {
      // Check if Twilio is configured
      if (!this.client) {
        console.warn('Twilio not configured. SMS not sent.');
        return {
          success: false,
          message: 'SMS service not configured'
        };
      }

      // Validate and format phone number
      if (!isValidPhoneNumber(to)) {
        throw new Error('Invalid phone number format');
      }

      const formattedPhone = formatPhoneNumber(to);

      // Send SMS using Twilio
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone
      });

      console.log('SMS sent:', result.sid);
      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Send verification SMS
  async sendVerificationSMS(phone, code) {
    try {
      const template = await this.loadTemplate('verification');
      
      let message;
      if (template) {
        message = this.replacePlaceholders(template, {
          code: code
        });
      } else {
        message = `Your E-Hospital verification code is: ${code}. Valid for 10 minutes.`;
      }

      return await this.sendSMS(phone, message);
    } catch (error) {
      console.error('Error sending verification SMS:', error);
      throw error;
    }
  }

  // Send appointment confirmation SMS
  async sendAppointmentConfirmation(appointment, patient, doctor) {
    try {
      const template = await this.loadTemplate('appointmentConfirmation');
      
      let message;
      if (template) {
        message = this.replacePlaceholders(template, {
          patientName: patient.firstName,
          doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          date: new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          time: appointment.appointmentTime,
          appointmentNumber: appointment.appointmentNumber
        });
      } else {
        message = `Appointment Confirmed!\nDoctor: Dr. ${doctor.firstName} ${doctor.lastName}\nDate: ${new Date(appointment.appointmentDate).toLocaleDateString()}\nTime: ${appointment.appointmentTime}\nRef: ${appointment.appointmentNumber}`;
      }

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending appointment confirmation SMS:', error);
      throw error;
    }
  }

  // Send appointment reminder SMS (24 hours before)
  async sendAppointmentReminder24h(appointment, patient, doctor) {
    try {
      const template = await this.loadTemplate('appointmentReminder');
      
      let message;
      if (template) {
        message = this.replacePlaceholders(template, {
          patientName: patient.firstName,
          doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          date: new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          time: appointment.appointmentTime,
          appointmentNumber: appointment.appointmentNumber
        });
      } else {
        message = `Reminder: Appointment tomorrow with Dr. ${doctor.firstName} ${doctor.lastName} at ${appointment.appointmentTime}. Ref: ${appointment.appointmentNumber}`;
      }

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending 24h appointment reminder SMS:', error);
      throw error;
    }
  }

  // Send appointment reminder SMS (1 hour before)
  async sendAppointmentReminder1h(appointment, patient, doctor) {
    try {
      const message = `Reminder: Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is in 1 hour at ${appointment.appointmentTime}. Ref: ${appointment.appointmentNumber}`;

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending 1h appointment reminder SMS:', error);
      throw error;
    }
  }

  // Send appointment cancellation SMS
  async sendAppointmentCancellation(appointment, patient, doctor) {
    try {
      const message = `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime} has been cancelled. Ref: ${appointment.appointmentNumber}`;

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending appointment cancellation SMS:', error);
      throw error;
    }
  }

  // Send appointment rescheduled SMS
  async sendAppointmentRescheduled(appointment, patient, doctor, newDate, newTime) {
    try {
      const message = `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTime}. Ref: ${appointment.appointmentNumber}`;

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending appointment rescheduled SMS:', error);
      throw error;
    }
  }

  // Send lab results ready SMS
  async sendLabResultsReady(patient, recordNumber) {
    try {
      const message = `Your lab results are ready. Record #${recordNumber}. Please login to view or visit the hospital.`;

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending lab results SMS:', error);
      throw error;
    }
  }

  // Send prescription ready SMS
  async sendPrescriptionReady(patient, prescriptionNumber) {
    try {
      const message = `Your prescription is ready for collection. Prescription #${prescriptionNumber}. Please collect from the pharmacy.`;

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending prescription ready SMS:', error);
      throw error;
    }
  }

  // Send payment confirmation SMS
  async sendPaymentConfirmation(patient, amount, referenceNumber) {
    try {
      const message = `Payment of NGN ${amount.toLocaleString()} received. Reference: ${referenceNumber}. Thank you!`;

      return await this.sendSMS(patient.phone, message);
    } catch (error) {
      console.error('Error sending payment confirmation SMS:', error);
      throw error;
    }
  }

  // Send emergency alert SMS
  async sendEmergencyAlert(doctor, message) {
    try {
      const alertMessage = `EMERGENCY ALERT: ${message}`;

      return await this.sendSMS(doctor.phone, alertMessage);
    } catch (error) {
      console.error('Error sending emergency alert SMS:', error);
      throw error;
    }
  }

  // Send custom SMS
  async sendCustomSMS(phone, message) {
    try {
      return await this.sendSMS(phone, message);
    } catch (error) {
      console.error('Error sending custom SMS:', error);
      throw error;
    }
  }
}

module.exports = new SMSService();