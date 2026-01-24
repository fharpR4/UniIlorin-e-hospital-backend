const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  }
});

// Generate employee ID before saving
adminSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.employeeId = `ADM${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Admin = User.discriminator('admin', adminSchema);

module.exports = Admin;