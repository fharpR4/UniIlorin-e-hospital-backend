const mongoose = require('mongoose');
const User = require('./User');

const patientSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  genotype: {
    type: String,
    enum: ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'],
    required: [true, 'Genotype is required']
  },
  height: {
    value: Number,
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  allergies: [
    {
      allergen: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      reaction: String
    }
  ],
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required']
    },
    email: String
  },
  registrationNumber: {
    type: String,
    unique: true
  }
});

// Generate patient registration number before saving
patientSchema.pre('save', async function (next) {
  if (!this.registrationNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.registrationNumber = `PT${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Patient = User.discriminator('patient', patientSchema);

module.exports = Patient;