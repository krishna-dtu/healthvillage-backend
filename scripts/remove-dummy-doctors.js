import mongoose from 'mongoose';
import { config } from 'dotenv';
import { User } from '../src/models/User.js';

config();

const MONGO_URI = process.env.MONGO_URI;

async function removeDummyDoctors() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all doctors
    const doctors = await User.find({ role: 'doctor' });
    if (doctors.length === 0) {
      console.log('No doctors found in the database.');
      return;
    }

    // List all doctors
    console.log('Doctors in the database:');
    doctors.forEach(doc => {
      console.log(`- ${doc.name} (${doc.email}) | Registered: ${doc.createdAt}`);
    });

    // Remove dummy doctors (those created by seed scripts, e.g. with known emails or before a certain date)
    // You can customize this filter as needed
    const dummyEmails = [
      'sarah.johnson@healthvillage.com',
      'michael.chen@healthvillage.com',
      'emily.rodriguez@healthvillage.com',
      'james.wilson@healthvillage.com',
      'priya.patel@healthvillage.com'
    ];
    const result = await User.deleteMany({ role: 'doctor', email: { $in: dummyEmails } });
    console.log(`\n🗑️ Removed ${result.deletedCount} dummy doctor(s).`);

    // List remaining doctors
    const remaining = await User.find({ role: 'doctor' });
    console.log('\nRemaining doctors:');
    remaining.forEach(doc => {
      console.log(`- ${doc.name} (${doc.email})`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

removeDummyDoctors();
