/**
 * MIGRATION SCRIPT: Convert old appointment_date/appointment_time to day/slotIndex
 * 
 * This script migrates legacy appointments to the new day-based schema.
 * Run this ONCE to clean up old data.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_system';

// Helper to get day from date
function getDayFromDate(dateString) {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Helper to get slotIndex from time
// Assumes 30-minute slots starting at 09:00
function getSlotIndexFromTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 9 * 60; // 09:00
  const slotDuration = 30;
  
  if (totalMinutes < startMinutes) return 0;
  
  return Math.floor((totalMinutes - startMinutes) / slotDuration);
}

async function migrateAppointments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');

    // Find all appointments with legacy schema
    const legacyAppointments = await appointmentsCollection.find({
      appointment_date: { $exists: true },
      appointment_time: { $exists: true }
    }).toArray();

    console.log(`📊 Found ${legacyAppointments.length} legacy appointments\n`);

    if (legacyAppointments.length === 0) {
      console.log('✅ No legacy appointments to migrate. Database is clean!\n');
      await mongoose.disconnect();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const apt of legacyAppointments) {
      try {
        const day = getDayFromDate(apt.appointment_date);
        const slotIndex = getSlotIndexFromTime(apt.appointment_time);

        console.log(`📝 Migrating appointment ${apt._id}:`);
        console.log(`   Old: ${apt.appointment_date} at ${apt.appointment_time}`);
        console.log(`   New: ${day} slot ${slotIndex}\n`);

        // Update with new schema
        await appointmentsCollection.updateOne(
          { _id: apt._id },
          {
            $set: {
              day: day,
              slotIndex: slotIndex
            },
            $unset: {
              appointment_date: "",
              appointment_time: ""
            }
          }
        );

        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating ${apt._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n================================================================================');
    console.log('  MIGRATION SUMMARY');
    console.log('================================================================================');
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${legacyAppointments.length}`);
    console.log('================================================================================\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAppointments();
