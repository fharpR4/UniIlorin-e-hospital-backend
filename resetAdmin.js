const mongoose = require('mongoose');
require('dotenv').config();

// ─────────────────────────────────────────────
// CONFIGURE YOUR NEW ADMIN DETAILS HERE
// ─────────────────────────────────────────────
const NEW_ADMIN = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'admin@ehospital.com',       // ← change if needed
  password: 'Admin@12345',            // ← change if needed
  phone: '08012345678',               // ← change if needed
  role: 'admin',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male',
  isEmailVerified: true,
  isActive: true,
};

const run = async () => {
  try {
    console.log('��� Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Load User model (let it handle password hashing via pre-save hook)
    let User;
    try {
      User = require('./src/models/User');
    } catch {
      try {
        User = require('./models/User');
      } catch {
        throw new Error('Cannot find User model. Check your models folder.');
      }
    }

    // Clear ALL users
    const deleteResult = await User.deleteMany({});
    console.log(`���️  Deleted ${deleteResult.deletedCount} users.\n`);

    // Create admin — NO manual bcrypt, let the model's pre-save hook hash it
    const admin = new User(NEW_ADMIN);
    await admin.save(); // triggers pre-save hook which hashes the password

    console.log('��� New admin created successfully!');
    console.log('─'.repeat(40));
    console.log(`   Name     : ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email    : ${admin.email}`);
    console.log(`   Password : ${NEW_ADMIN.password}`);
    console.log(`   Role     : ${admin.role}`);
    console.log(`   ID       : ${admin._id}`);
    console.log('─'.repeat(40));
    console.log('\n✅ Done! Login with the credentials above.');
    console.log('⚠️  DELETE this script after use!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('��� Disconnected.');
    process.exit(0);
  }
};

run();
