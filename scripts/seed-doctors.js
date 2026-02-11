import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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

/**
 * Sample doctors with specializations
 */
const sampleDoctors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@healthvillage.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'General Practitioner',
    availability: [
      { day_of_week: 'monday', start_time: '09:00', end_time: '17:00' },
      { day_of_week: 'tuesday', start_time: '09:00', end_time: '17:00' },
      { day_of_week: 'wednesday', start_time: '09:00', end_time: '17:00' },
      { day_of_week: 'thursday', start_time: '09:00', end_time: '17:00' },
      { day_of_week: 'friday', start_time: '09:00', end_time: '13:00' },
    ],
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@healthvillage.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Cardiologist',
    availability: [
      { day_of_week: 'monday', start_time: '10:00', end_time: '18:00' },
      { day_of_week: 'wednesday', start_time: '10:00', end_time: '18:00' },
      { day_of_week: 'friday', start_time: '10:00', end_time: '18:00' },
    ],
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@healthvillage.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Pediatrician',
    availability: [
      { day_of_week: 'tuesday', start_time: '08:00', end_time: '16:00' },
      { day_of_week: 'thursday', start_time: '08:00', end_time: '16:00' },
      { day_of_week: 'saturday', start_time: '09:00', end_time: '13:00' },
    ],
  },
  {
    name: 'Dr. James Wilson',
    email: 'james.wilson@healthvillage.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Orthopedic Surgeon',
    availability: [
      { day_of_week: 'monday', start_time: '08:00', end_time: '12:00' },
      { day_of_week: 'tuesday', start_time: '13:00', end_time: '17:00' },
      { day_of_week: 'wednesday', start_time: '08:00', end_time: '12:00' },
      { day_of_week: 'thursday', start_time: '13:00', end_time: '17:00' },
      { day_of_week: 'friday', start_time: '08:00', end_time: '12:00' },
    ],
  },
  {
    name: 'Dr. Priya Patel',
    email: 'priya.patel@healthvillage.com',
    password: 'Doctor123',
    role: 'doctor',
    specialization: 'Dermatologist',
    availability: [
      { day_of_week: 'monday', start_time: '11:00', end_time: '19:00' },
      { day_of_week: 'tuesday', start_time: '11:00', end_time: '19:00' },
      { day_of_week: 'thursday', start_time: '11:00', end_time: '19:00' },
      { day_of_week: 'friday', start_time: '11:00', end_time: '19:00' },
    ],
  },
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Seed doctors and their availability
 */
const seedDoctors = async () => {
  try {
    console.log('\n🌱 Starting doctor seeding process...\n');

    for (const doctorData of sampleDoctors) {
      // Check if doctor already exists
      const existingDoctor = await User.findOne({ email: doctorData.email });
      
      if (existingDoctor) {
        console.log(`⏭️  Skipping ${doctorData.name} - already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(doctorData.password, 12);

      // Create doctor user
      const doctor = await User.create({
        name: doctorData.name,
        email: doctorData.email,
        password: hashedPassword,
        role: doctorData.role,
      });

      console.log(`✅ Created doctor: ${doctor.name} (${doctorData.specialization})`);

      // Create availability schedules
      for (const schedule of doctorData.availability) {
        await DoctorAvailability.create({
          doctorId: doctor._id.toString(),
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        });
      }

      console.log(`   📅 Added ${doctorData.availability.length} availability slots`);
    }

    console.log('\n✅ Doctor seeding completed successfully!\n');
    
    // Display summary
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalAvailability = await DoctorAvailability.countDocuments();
    
    console.log('📊 Summary:');
    console.log(`   Total doctors in database: ${totalDoctors}`);
    console.log(`   Total availability slots: ${totalAvailability}`);
    console.log('\n💡 Default password for all doctors: Doctor123');
    console.log('   (Contains uppercase, lowercase, and number as required)\n');
    
  } catch (error) {
    console.error('❌ Error seeding doctors:', error.message);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async () => {
  try {
    await connectDB();
    await seedDoctors();
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();
