# Database Seeding Scripts

This directory contains scripts to populate the database with sample data for development and testing.

## Available Scripts

### Seed Doctors (`seed-doctors.js`)

Populates the database with sample doctors and their availability schedules.

**Usage:**
```bash
npm run seed:doctors
```

**What it does:**
- Creates 5 sample doctors with different specializations:
  - Dr. Sarah Johnson (General Practitioner)
  - Dr. Michael Chen (Cardiologist)
  - Dr. Emily Rodriguez (Pediatrician)
  - Dr. James Wilson (Orthopedic Surgeon)
  - Dr. Priya Patel (Dermatologist)
- Adds availability schedules for each doctor
- Skips doctors that already exist (safe to run multiple times)

**Default Credentials:**
- Email: `[firstname].[lastname]@healthvillage.com`
- Password: `Doctor123` (for all doctors)

**Features:**
- ✅ Idempotent - safe to run multiple times
- ✅ Validates existing data before inserting
- ✅ Creates realistic availability schedules
- ✅ Provides detailed console output

### Seed Medical Records (`seed-medical-records.js`)

Populates the database with sample medical records (EHR) for testing.

**Usage:**
```bash
node scripts/seed-medical-records.js
```

**What it does:**
- Finds the first patient and doctor in the database
- Creates 6 sample medical records:
  - 2 Lab Results (CBC, Lipid Panel)
  - 1 Prescription (Amoxicillin)
  - 2 Visit Summaries (Annual Physical, Follow-up)
  - 1 Imaging (Chest X-Ray)
- Each record includes detailed content, provider info, and realistic dates
- Clears existing records for the patient before seeding

**Prerequisites:**
- At least one patient user must exist in the database
- At least one doctor user must exist in the database

**Features:**
- ✅ Realistic medical record content
- ✅ Multiple record types
- ✅ Date-distributed records (7-60 days ago)
- ✅ Detailed console output

## Requirements

- MongoDB must be running
- Backend `.env` file must be configured with `MONGODB_URI`

## Notes

- All passwords are hashed using bcrypt (cost factor: 12)
- Doctors can log in using their email and the default password
- Availability schedules vary by doctor to simulate real-world scenarios
