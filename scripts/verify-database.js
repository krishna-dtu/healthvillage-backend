import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import { User } from '../src/models/User.js';
import { DoctorAvailability } from '../src/models/DoctorAvailability.js';
import { Appointment } from '../src/models/Appointment.js';

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthvillage';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Verify database contents
 */
const verifyDatabase = async () => {
  try {
    console.log('\n🔍 DATABASE VERIFICATION\n');
    console.log('='.repeat(60));

    // Check Users
    const totalUsers = await User.countDocuments();
    const patients = await User.countDocuments({ role: 'patient' });
    const doctors = await User.countDocuments({ role: 'doctor' });
    const admins = await User.countDocuments({ role: 'admin' });

    console.log('\n👥 USERS:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   Patients: ${patients}`);
    console.log(`   Doctors: ${doctors}`);
    console.log(`   Admins: ${admins}`);

    if (doctors === 0) {
      console.log('   ⚠️  WARNING: No doctors found! Run: npm run seed:doctors');
    } else {
      console.log('\n   📋 Doctor List:');
      const doctorList = await User.find({ role: 'doctor' }, 'name email').lean();
      doctorList.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.name} (${doc.email})`);
      });
    }

    // Check Doctor Availability
    const totalAvailability = await DoctorAvailability.countDocuments();
    console.log(`\n📅 DOCTOR AVAILABILITY:`);
    console.log(`   Total slots: ${totalAvailability}`);

    if (totalAvailability === 0) {
      console.log('   ⚠️  WARNING: No availability slots found!');
    } else {
      // Group by doctor
      const availabilityByDoctor = await DoctorAvailability.aggregate([
        {
          $group: {
            _id: '$doctorId',
            count: { $sum: 1 },
            days: { $addToSet: '$day_of_week' },
          },
        },
      ]);

      console.log('\n   📊 Availability by Doctor:');
      for (const avail of availabilityByDoctor) {
        const doctor = await User.findById(avail._id, 'name').lean();
        console.log(`   ${doctor ? doctor.name : 'Unknown'}: ${avail.count} slots on ${avail.days.join(', ')}`);
      }
    }

    // Check Appointments
    const totalAppointments = await Appointment.countDocuments();
    const scheduled = await Appointment.countDocuments({ status: 'scheduled' });
    const confirmed = await Appointment.countDocuments({ status: 'confirmed' });
    const completed = await Appointment.countDocuments({ status: 'completed' });
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });

    console.log(`\n📆 APPOINTMENTS:`);
    console.log(`   Total: ${totalAppointments}`);
    console.log(`   Scheduled: ${scheduled}`);
    console.log(`   Confirmed: ${confirmed}`);
    console.log(`   Completed: ${completed}`);
    console.log(`   Cancelled: ${cancelled}`);

    // Check indexes
    console.log(`\n🔍 INDEXES:`);
    const appointmentIndexes = await Appointment.collection.getIndexes();
    console.log(`   Appointment indexes: ${Object.keys(appointmentIndexes).length}`);
    Object.keys(appointmentIndexes).forEach(indexName => {
      console.log(`   - ${indexName}`);
    });

    // Test a sample availability check
    if (doctors > 0) {
      console.log(`\n🧪 SAMPLE AVAILABILITY CHECK:`);
      const sampleDoctor = await User.findOne({ role: 'doctor' }).lean();
      const sampleAvailability = await DoctorAvailability.find({ 
        doctorId: sampleDoctor._id.toString() 
      }).lean();

      console.log(`   Doctor: ${sampleDoctor.name}`);
      console.log(`   Availability rules: ${sampleAvailability.length}`);
      
      if (sampleAvailability.length > 0) {
        console.log(`   Sample rule:`);
        const rule = sampleAvailability[0];
        console.log(`     Day: ${rule.day_of_week}`);
        console.log(`     Time: ${rule.start_time} - ${rule.end_time}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Database verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    await connectDB();
    await verifyDatabase();
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();
