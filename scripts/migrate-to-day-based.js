/**
 * 🔄 DATABASE MIGRATION SCRIPT
 * 
 * Converts existing appointments from date-based to day-based system
 * 
 * BEFORE RUNNING:
 * 1. Backup your database: mongodump --db healthvillage
 * 2. Ensure backend is deployed with new schema
 * 3. Update frontend to use new day/slotIndex system
 * 
 * RUN: node backend/scripts/migrate-to-day-based.js
 */

import mongoose from 'mongoose';
import { Appointment } from '../src/models/Appointment.js';
import { DoctorAvailability } from '../src/models/DoctorAvailability.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvillage';

/**
 * Map time string to slot index
 * Assumes hospital operates 9:00 AM - 5:00 PM with hourly slots
 */
function timeToSlotIndex(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  const hourMinutes = hour * 60 + minute;
  const startTime = 9 * 60; // 9:00 AM
  const slotDuration = 60; // 60 minutes per slot
  
  const slotIndex = Math.floor((hourMinutes - startTime) / slotDuration);
  return Math.max(0, slotIndex); // Ensure non-negative
}

/**
 * Get day of week name from date
 */
function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
}

async function migrateAppointments() {
  console.log('\n🔄 ========== MIGRATION START ==========\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Fetch all appointments with old schema
    const oldAppointments = await mongoose.connection.db
      .collection('appointments')
      .find({ appointment_date: { $exists: true } })
      .toArray();
    
    console.log(`\n📋 Found ${oldAppointments.length} appointments to migrate\n`);
    
    if (oldAppointments.length === 0) {
      console.log('✅ No appointments to migrate (already migrated or none exist)');
      await mongoose.disconnect();
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const apt of oldAppointments) {
      try {
        // Extract day and slotIndex from old fields
        const day = getDayOfWeek(apt.appointment_date);
        const slotIndex = timeToSlotIndex(apt.appointment_time);
        
        // Skip Sunday appointments (shouldn't exist, but just in case)
        if (day === 'sunday') {
          console.log(`⚠️  Skipping Sunday appointment: ${apt._id} (${apt.appointment_date})`);
          skipped++;
          continue;
        }
        
        console.log(`  Migrating ${apt._id}:`);
        console.log(`    ${apt.appointment_date} ${apt.appointment_time} → ${day} slot ${slotIndex}`);
        
        // Update appointment
        await mongoose.connection.db.collection('appointments').updateOne(
          { _id: apt._id },
          { 
            $set: { day, slotIndex },
            $unset: { appointment_date: "", appointment_time: "" }
          }
        );
        
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating appointment ${apt._id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Migration Results:');
    console.log(`  ✅ Migrated: ${migrated}`);
    console.log(`  ⚠️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    
    // Update availability rules to add totalSlots if missing
    console.log('\n🔧 Updating availability rules...');
    const result = await DoctorAvailability.updateMany(
      { totalSlots: { $exists: false } },
      { $set: { totalSlots: 10 } }
    );
    
    console.log(`  ✅ Updated ${result.modifiedCount} availability rules with totalSlots: 10`);
    
    console.log('\n🔄 ========== MIGRATION COMPLETE ==========\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateAppointments();
