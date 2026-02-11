import mongoose from 'mongoose';
import { config } from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord.js';
import { User } from '../src/models/User.js';

config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvillage';

async function checkRecords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Krishna Joshi
    const krishna = await User.findOne({ email: 'kj20130284870@gmail.com' });
    if (krishna) {
      console.log(`👤 Krishna Joshi ID: ${krishna._id}`);
      console.log(`   Role: ${krishna.role}`);
      console.log(`   Name: ${krishna.name}\n`);
    } else {
      console.log('❌ Krishna Joshi not found\n');
    }

    // Find all patients
    const patients = await User.find({ role: 'patient' });
    console.log(`📋 Found ${patients.length} patients:`);
    patients.forEach(p => {
      console.log(`   - ${p.name} (${p.email}) - ID: ${p._id}`);
    });
    console.log('');

    // Find all medical records
    const allRecords = await MedicalRecord.find({});
    console.log(`📄 Found ${allRecords.length} medical records in database\n`);

    if (allRecords.length > 0) {
      console.log('Records by patient:');
      const recordsByPatient = {};
      
      allRecords.forEach(record => {
        const patientId = record.patientId.toString();
        if (!recordsByPatient[patientId]) {
          recordsByPatient[patientId] = [];
        }
        recordsByPatient[patientId].push(record);
      });

      for (const [patientId, records] of Object.entries(recordsByPatient)) {
        const patient = await User.findById(patientId);
        console.log(`\n👤 Patient: ${patient?.name || 'Unknown'} (${patientId})`);
        console.log(`   Records: ${records.length}`);
        records.forEach(r => {
          console.log(`   - ${r.type}: ${r.title}`);
        });
      }
    }

    // Check if Krishna has any records
    if (krishna) {
      const krishnaRecords = await MedicalRecord.find({ patientId: krishna._id });
      console.log(`\n\n🔍 Medical records for Krishna Joshi: ${krishnaRecords.length}`);
      if (krishnaRecords.length === 0) {
        console.log('   ❌ No records found for Krishna Joshi!');
        console.log('   This is why the Medical Records page is empty.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkRecords();
