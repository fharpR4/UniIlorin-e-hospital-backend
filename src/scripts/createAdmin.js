const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('❌ Admin already exists with email:', process.env.ADMIN_EMAIL);
      process.exit(0);
    }

    // Create admin WITH ALL REQUIRED FIELDS
    const admin = await Admin.create({
      firstName: process.env.ADMIN_FIRST_NAME || 'System',
      lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@ehospital.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      phone: '+234-000-000-0000',
      isEmailVerified: true, // Auto-verify admin
      isActive: true,
      
      // ADD THESE REQUIRED FIELDS:
      dateOfBirth: new Date('1990-01-01'), // Required: Add a date
      gender: 'male', // Required: 'male', 'female', or 'other'
      department: 'Administration', // Required: Department name
      
      // Optional additional fields:
      address: 'University of Ilorin, Ilorin, Nigeria',
      specialization: 'System Administration',
      licenseNumber: 'ADMIN-001',
      yearsOfExperience: 5
    });

    console.log('✓ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('\n✅ You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();