const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    reasonForVisit: {
      type: String,
      required: true
    },
    consultationFee: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Generate appointment number before saving
appointmentSchema.pre('save', async function (next) {
  if (!this.appointmentNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `APT${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;