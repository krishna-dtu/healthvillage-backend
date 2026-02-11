import mongoose from 'mongoose';
import { config } from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord.js';
import { User } from '../src/models/User.js';

config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvillage';

async function testQuery() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const krishna = await User.findOne({ email: 'kj20130284870@gmail.com' });
    console.log(`👤 Krishna ID: ${krishna._id}`);
    console.log(`   Type: ${typeof krishna._id}`);
    console.log(`   String: ${krishna._id.toString()}\n`);

    // Test 1: Find with ObjectId
    console.log('Test 1: Query with ObjectId');
    const records1 = await MedicalRecord.find({ patientId: krishna._id });
    console.log(`   Found: ${records1.length} records\n`);

    // Test 2: Find with string ID
    console.log('Test 2: Query with string ID');
    const records2 = await MedicalRecord.find({ patientId: krishna._id.toString() });
    console.log(`   Found: ${records2.length} records\n`);

    // Test 3: Query with populations (like the service does)
    console.log('Test 3: Query with populate (mimicking ehr.service.js)');
    const records3 = await MedicalRecord.find({ patientId: krishna._id })
      .populate('doctorId', 'name email specialization')
      .sort({ date: -1 })
      .lean();
    console.log(`   Found: ${records3.length} records`);
    
    if (records3.length > 0) {
      console.log('\n   Sample record:');
      console.log(`   - Type: ${records3[0].type}`);
      console.log(`   - Title: ${records3[0].title}`);
      console.log(`   - Doctor: ${records3[0].doctorId?.name || 'null'}`);
    }

    // Test 4: Check what the service returns
    console.log('\n\nTest 4: Simulating getPatientRecords service function');
    const formatted = records3.map(record => ({
      _id: record._id,
      type: record.type,
      title: record.title,
      description: record.description,
      content: record.content,
      provider: record.provider,
      date: record.date,
      doctorName: record.doctorId?.name,
      metadata: record.metadata,
    }));
    
    console.log(`   Formatted: ${formatted.length} records`);
    console.log(`   JSON size: ${JSON.stringify({ success: true, data: formatted }).length} bytes`);
    
    if (formatted.length > 0) {
      console.log('\n   First formatted record:');
      console.log(JSON.stringify(formatted[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testQuery();
