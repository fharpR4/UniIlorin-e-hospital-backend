const mongoose = require('mongoose');
const User = require('./User');

const doctorSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: [true, 'Specialization is required']
  },
  licenseNumber: {
    type: String,
    required: [true, 'Medical license number is required'],
    unique: true
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: 0
  },
  employeeId: {
    type: String,
    unique: true
  }
});

// Generate employee ID before saving
doctorSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.employeeId = `DR${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Doctor = User.discriminator('doctor', doctorSchema);

module.exports = Doctor;