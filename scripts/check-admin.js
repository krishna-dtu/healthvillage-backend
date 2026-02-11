import mongoose from 'mongoose';
import { config } from 'dotenv';
import { User } from '../src/models/User.js';

config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvillage';

async function checkAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all admins
    const admins = await User.find({ role: 'admin' });
    console.log(`👥 Found ${admins.length} admin user(s):\n`);

    if (admins.length === 0) {
      console.log('❌ No admin users found in the database.');
      console.log('\nYou need to create an admin user to access the admin dashboard.');
    } else {
      admins.forEach(admin => {
        console.log(`   - ${admin.name}`);
        console.log(`     Email: ${admin.email}`);
        console.log(`     ID: ${admin._id}`);
        console.log('');
      });
    }

    // Show all users
    const allUsers = await User.find({});
    console.log(`\n📋 All users in database:`);
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkAdmin();
