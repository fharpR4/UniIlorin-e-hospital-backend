const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  recordNumber: {
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
  diagnosis: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

medicalRecordSchema.pre('save', async function (next) {
  if (!this.recordNumber) {
    const count = await this.constructor.countDocuments();
    this.recordNumber = `MR${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;