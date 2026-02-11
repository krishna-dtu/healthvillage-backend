/**
 * 🔧 DROP OLD INDEXES - Day-Based Migration
 * 
 * Drops old appointment_date/appointment_time indexes
 * Ensures new day/slotIndex indexes exist
 * 
 * RUN: node backend/scripts/drop-old-indexes.js
 */

import mongoose from 'mongoose';
import { Appointment } from '../src/models/Appointment.js';
import { DoctorAvailability } from '../src/models/DoctorAvailability.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvillage';

async function dropOldIndexes() {
  console.log('\n🔧 ========== DROPPING OLD INDEXES ==========\n');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get current indexes
    console.log('📋 BEFORE - Current indexes on Appointment collection:');
    const oldIndexes = await Appointment.collection.getIndexes();
    Object.keys(oldIndexes).forEach((name) => {
      console.log(`   ${name}: ${JSON.stringify(oldIndexes[name])}`);
    });
    
    // Drop old indexes that use appointment_date/appointment_time
    const indexesToDrop = Object.keys(oldIndexes).filter(key =>
      key.includes('appointment_date') || key.includes('appointment_time')
    );
    
    console.log(`\n🗑️  Dropping ${indexesToDrop.length} old indexes...\n`);
    
    for (const indexName of indexesToDrop) {
      try {
        await Appointment.collection.dropIndex(indexName);
        console.log(`   ✅ Dropped: ${indexName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop ${indexName}: ${error.message}`);
      }
    }
    
    // Ensure new indexes exist
    console.log('\n🔨 Ensuring new day/slotIndex indexes...');
    
    try {
      await Appointment.collection.createIndex(
        { patientId: 1, createdAt: -1 },
        { name: 'patientId_1_createdAt_-1' }
      );
      console.log('   ✅ Created: patientId_1_createdAt_-1');
    } catch (error) {
      console.log(`   ℹ️  Index already exists: patientId_1_createdAt_-1`);
    }
    
    try {
      await Appointment.collection.createIndex(
        { doctorId: 1, day: 1 },
        { name: 'doctorId_1_day_1' }
      );
      console.log('   ✅ Created: doctorId_1_day_1');
    } catch (error) {
      console.log(`   ℹ️  Index already exists: doctorId_1_day_1`);
    }
    
    try {
      await Appointment.collection.createIndex(
        { status: 1, day: 1 },
        { name: 'status_1_day_1' }
      );
      console.log('   ✅ Created: status_1_day_1');
    } catch (error) {
      console.log(`   ℹ️  Index already exists: status_1_day_1`);
    }
    
    // CRITICAL: Compound unique index
    try {
      await Appointment.collection.createIndex(
        { doctorId: 1, day: 1, slotIndex: 1, status: 1 },
        {
          unique: true,
          partialFilterExpression: {
            status: { $in: ['scheduled', 'confirmed'] }
          },
          name: 'unique_active_day_slot'
        }
      );
      console.log('   ✅ Created: unique_active_day_slot (CRITICAL - prevents double booking)');
    } catch (error) {
      console.log(`   ℹ️  Index already exists: unique_active_day_slot`);
    }
    
    console.log('\n📋 AFTER - Current indexes on Appointment collection:');
    const newIndexes = await Appointment.collection.getIndexes();
    Object.keys(newIndexes).forEach((name) => {
      console.log(`   ${name}: ${JSON.stringify(newIndexes[name])}`);
    });
    
    // Verify no old field indexes remain
    const hasOldIndexes = Object.keys(newIndexes).some(key =>
      key.includes('appointment_date') || key.includes('appointment_time')
    );
    
    if (hasOldIndexes) {
      console.log('\n❌ ERROR: Old indexes still exist!');
    } else {
      console.log('\n✅ SUCCESS: All old indexes removed, new indexes in place');
    }
    
    console.log('\n🔧 ========== INDEX UPDATE COMPLETE ==========\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

dropOldIndexes();
