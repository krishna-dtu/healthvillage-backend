import mongoose from 'mongoose';
import { config } from 'dotenv';
import MedicalRecord from '../src/models/MedicalRecord.js';
import { User } from '../src/models/User.js';

config();

const MONGO_URI = process.env.MONGO_URI;

async function seedForNitigya() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Nitigya Shreya
    const patient = await User.findOne({ email: 'nitigyashreya100@gmail.com' });
    if (!patient) {
      console.log('❌ Nitigya not found');
      process.exit(1);
    }

    const doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      console.log('❌ No doctor found');
      process.exit(1);
    }

    console.log(`👤 Seeding for: ${patient.name} (${patient.email})`);
    console.log(`👨‍⚕️ Doctor: ${doctor.name}\n`);

    // Clear existing records
    await MedicalRecord.deleteMany({ patientId: patient._id });

    // Create sample records
    const records = [
      {
        type: 'Lab Results',
        title: 'Complete Blood Count (CBC)',
        description: 'Routine blood work showing all values within normal range.',
        content: `COMPLETE BLOOD COUNT RESULTS
Date: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

White Blood Cells: 7.2 K/uL (Normal: 4.5-11.0)
Red Blood Cells: 4.8 M/uL (Normal: 4.5-5.5)
Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
Hematocrit: 42% (Normal: 38-50%)
Platelets: 250 K/uL (Normal: 150-400)

All values within normal range. No immediate concerns.`,
        provider: 'HealthVillage Laboratory',
        daysAgo: 7,
      },
      {
        type: 'Prescription',
        title: 'Amoxicillin 500mg',
        description: 'Antibiotic for bacterial infection',
        content: `PRESCRIPTION

Medication: Amoxicillin 500mg
Dosage: Take 1 capsule by mouth three times daily
Duration: 7 days
Quantity: 21 capsules

Instructions:
- Take with food to reduce stomach upset
- Complete full course even if feeling better
- Avoid alcohol

Prescribed by: ${doctor.name}
Date: ${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
        provider: 'HealthVillage Pharmacy',
        daysAgo: 14,
      },
      {
        type: 'Visit Summary',
        title: 'Annual Physical Examination',
        description: 'Comprehensive annual checkup - all normal',
        content: `ANNUAL PHYSICAL EXAMINATION

Date: ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Provider: ${doctor.name}

Vital Signs:
- Blood Pressure: 118/76 mmHg
- Heart Rate: 72 bpm
- Temperature: 98.6°F
- Weight: 68 kg
- Height: 165 cm
- BMI: 25.0

Physical Exam: Normal
Systems Review: All systems normal

Assessment: Patient in good health
Plan: Return in 1 year for next annual exam`,
        provider: doctor.name,
        daysAgo: 30,
      },
      {
        type: 'Lab Results',
        title: 'Lipid Panel',
        description: 'Cholesterol and triglyceride levels check.',
        content: `LIPID PANEL RESULTS
Date: ${new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Total Cholesterol: 185 mg/dL (Desirable: <200)
LDL Cholesterol: 110 mg/dL (Optimal: <100)
HDL Cholesterol: 55 mg/dL (Good: >40)
Triglycerides: 95 mg/dL (Normal: <150)

Interpretation: Overall good cholesterol levels.
Recommendations: Continue heart-healthy diet and regular exercise.`,
        provider: 'HealthVillage Laboratory',
        daysAgo: 35,
      },
      {
        type: 'Imaging',
        title: 'Chest X-Ray',
        description: 'Routine chest X-ray - no abnormalities detected.',
        content: `CHEST X-RAY REPORT

Study Date: ${new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Indication: Routine health screening

Technique: PA and lateral chest radiographs

Findings:
- Lungs: Clear, no infiltrates or masses
- Heart: Normal size and contour
- Mediastinum: Normal
- No pleural effusion
- Bones: No acute abnormalities

Impression: Normal chest X-ray`,
        provider: 'HealthVillage Radiology',
        daysAgo: 60,
      },
      {
        type: 'Visit Summary',
        title: 'Follow-up Consultation',
        description: 'Follow-up for recent illness - recovered well',
        content: `FOLLOW-UP CONSULTATION

Date: ${new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Provider: ${doctor.name}

Reason: Follow-up after upper respiratory infection

Patient reports complete resolution of symptoms. No cough, fever, or congestion.
Completed full course of antibiotics as prescribed.

Physical Exam:
- Lungs: Clear bilaterally
- Throat: No inflammation
- Lymph nodes: Not enlarged

Assessment: Fully recovered from acute illness
Plan: No further treatment needed. Return if symptoms recur.`,
        provider: doctor.name,
        daysAgo: 21,
      },
    ];

    for (const record of records) {
      await MedicalRecord.create({
        patientId: patient._id,
        doctorId: doctor._id,
        type: record.type,
        title: record.title,
        description: record.description,
        content: record.content,
        provider: record.provider,
        date: new Date(Date.now() - record.daysAgo * 24 * 60 * 60 * 1000),
      });
      console.log(`✅ Created: ${record.type} - ${record.title}`);
    }

    console.log(`\n🎉 Successfully seeded ${records.length} medical records for ${patient.name}!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedForNitigya();
