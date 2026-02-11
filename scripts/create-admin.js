import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { User } from '../src/models/User.js';

config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvillage';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@healthvillage.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('\n💡 You can login with:');
      console.log('   Email: admin@healthvillage.com');
      console.log('   Password: Admin@123');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@healthvillage.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('   Email: admin@healthvillage.com');
    console.log('   Password: Admin@123');
    console.log('\n🔐 Please change the password after first login!');
    console.log(`\n👤 User ID: ${admin._id}`);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin();
