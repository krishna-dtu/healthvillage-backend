import mongoose from 'mongoose';
import { config } from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord.js';
import { User } from '../src/models/User.js';

// Load environment variables
config();

const MONGO_URI = process.env.MONGO_URI;

// Sample medical records data
const sampleRecords = [
  {
    type: 'Lab Results',
    title: 'Complete Blood Count (CBC)',
    description: 'Routine blood work showing all values within normal range.',
    content: `
COMPLETE BLOOD COUNT RESULTS
Date: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

White Blood Cells: 7.2 K/uL (Normal: 4.5-11.0)
Red Blood Cells: 4.8 M/uL (Normal: 4.5-5.5)
Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
Hematocrit: 42% (Normal: 38-50%)
Platelets: 250 K/uL (Normal: 150-400)

All values within normal range. No immediate concerns.
    `.trim(),
    provider: 'HealthVillage Laboratory',
    daysAgo: 7,
  },
  {
    type: 'Prescription',
    title: 'Amoxicillin 500mg',
    description: 'Antibiotic for bacterial infection',
    content: `
PRESCRIPTION

Medication: Amoxicillin 500mg
Dosage: Take 1 capsule by mouth three times daily
Duration: 10 days
Refills: 0

Instructions:
- Take with food to minimize stomach upset
- Complete the full course even if symptoms improve
- Do not take if allergic to penicillin
- Store at room temperature

Prescriber: Dr. Sarah Johnson, MD
Date: ${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
    `.trim(),
    provider: 'Dr. Sarah Johnson',
    daysAgo: 14,
  },
  {
    type: 'Visit Summary',
    title: 'Annual Physical Examination',
    description: 'Routine annual checkup - all vital signs normal.',
    content: `
VISIT SUMMARY

Date: ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Provider: Dr. Sarah Johnson, MD

Chief Complaint: Annual physical examination

Vital Signs:
- Blood Pressure: 120/80 mmHg
- Heart Rate: 72 bpm
- Temperature: 98.6°F (37°C)
- Respiratory Rate: 16 breaths/min
- BMI: 24.5 (Normal weight)

Physical Examination: Normal

Assessment:
Patient is in good health. All vital signs within normal limits.

Plan:
- Continue current lifestyle
- Schedule follow-up in 1 year
- Recommended flu shot
- Blood work ordered (CBC, Lipid Panel)

Follow-up: 12 months or as needed
    `.trim(),
    provider: 'Dr. Sarah Johnson',
    daysAgo: 30,
  },
  {
    type: 'Lab Results',
    title: 'Lipid Panel',
    description: 'Cholesterol and triglyceride levels check.',
    content: `
LIPID PANEL RESULTS
Date: ${new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Total Cholesterol: 185 mg/dL (Desirable: <200)
LDL Cholesterol: 110 mg/dL (Optimal: <100)
HDL Cholesterol: 55 mg/dL (Good: >40)
Triglycerides: 95 mg/dL (Normal: <150)

Interpretation:
Overall good cholesterol levels. LDL slightly elevated but within acceptable range.

Recommendations:
- Continue heart-healthy diet
- Regular exercise
- Recheck in 6 months
    `.trim(),
    provider: 'HealthVillage Laboratory',
    daysAgo: 35,
  },
  {
    type: 'Imaging',
    title: 'Chest X-Ray',
    description: 'Routine chest X-ray - no abnormalities detected.',
    content: `
CHEST X-RAY REPORT

Study Date: ${new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Indication: Routine health screening

Technique: PA and lateral chest radiographs

Findings:
- Lungs: Clear, no infiltrates or masses
- Heart: Normal size and contour
- Mediastinum: Normal
- Pleura: No effusion or pneumothorax
- Bones: No acute fractures

Impression:
Normal chest radiograph. No acute cardiopulmonary disease.

Radiologist: Dr. Michael Chen, MD
    `.trim(),
    provider: 'HealthVillage Imaging Center',
    daysAgo: 60,
  },
  {
    type: 'Visit Summary',
    title: 'Follow-up Consultation',
    description: 'Follow-up for previous treatment - symptoms resolved.',
    content: `
FOLLOW-UP VISIT SUMMARY

Date: ${new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Provider: Dr. Sarah Johnson, MD

Reason for Visit: Follow-up from previous bacterial infection

Patient Report:
Completed full course of Amoxicillin. All symptoms resolved.
No adverse reactions to medication.

Physical Examination:
- Vital signs stable
- No signs of residual infection
- Recovery complete

Assessment:
Successful treatment of infection. Patient has fully recovered.

Plan:
- No further treatment needed
- Return if symptoms recur
- Continue normal activities

Next Appointment: As needed
    `.trim(),
    provider: 'Dr. Sarah Johnson',
    daysAgo: 21,
  },
];

async function seedMedicalRecords() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a patient user
    const patient = await User.findOne({ role: 'patient' });
    if (!patient) {
      console.log('❌ No patient found in database. Please create a patient user first.');
      process.exit(1);
    }

    // Find a doctor user
    const doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      console.log('❌ No doctor found in database. Please create a doctor user first.');
      process.exit(1);
    }

    console.log(`👤 Using patient: ${patient.name} (${patient.email})`);
    console.log(`👨‍⚕️ Using doctor: ${doctor.name} (${doctor.email})\n`);

    // Clear existing medical records for this patient
    const deleteResult = await MedicalRecord.deleteMany({ patientId: patient._id });
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing medical records\n`);

    // Create medical records
    const records = [];
    for (const record of sampleRecords) {
      const medicalRecord = await MedicalRecord.create({
        patientId: patient._id,
        doctorId: doctor._id,
        type: record.type,
        title: record.title,
        description: record.description,
        content: record.content,
        provider: record.provider,
        date: new Date(Date.now() - record.daysAgo * 24 * 60 * 60 * 1000),
      });
      
      records.push(medicalRecord);
      console.log(`✅ Created: ${record.type} - ${record.title}`);
    }

    console.log(`\n🎉 Successfully seeded ${records.length} medical records!`);
    console.log(`\n📊 Summary by Type:`);
    
    const typeCounts = records.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log(`\n✅ Seeding complete!`);
    
  } catch (error) {
    console.error('❌ Error seeding medical records:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedMedicalRecords();
