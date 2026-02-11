# Backend API Test Guide

## All Fixed Issues ✅

### A. Appointments (MANDATORY)
- ✅ GET /api/users/doctors - List all doctors
- ✅ Doctor validation during appointment creation
- ✅ Correct HTTP methods (PATCH vs PUT) - Both supported for reschedule
- ✅ Proper reschedule support with ownership validation
- ✅ Appointment ownership authorization
- ✅ Appointments return doctor and patient names, not raw IDs

### B. Availability (REALISTIC)
- ✅ Multiple time slots per day support
- ✅ Per-weekday schedules
- ✅ Missing availability APIs implemented (GET /me, PATCH /:id, DELETE /:id)
- ✅ Appointment booking validates against real availability

### C. Users & Dashboards
- ✅ GET /api/users - List all users (admin)
- ✅ GET /api/users/:id - Get user by ID
- ✅ GET /api/users/doctors/list - List all doctors
- ✅ GET /api/appointments - Admin can see all appointments
- ✅ All endpoints return human-readable data

## API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Users
```
GET    /api/users                    [Admin only] - Get all users
GET    /api/users/:id                [Authenticated] - Get user by ID
GET    /api/users/doctors/list       [Authenticated] - Get all doctors
```

### Appointments
```
POST   /api/appointments             [Patient] - Create appointment
GET    /api/appointments             [Admin] - Get all appointments
GET    /api/appointments/patient     [Patient] - Get patient's appointments
GET    /api/appointments/doctor      [Doctor] - Get doctor's appointments
PATCH  /api/appointments/:id/confirm [Doctor] - Confirm appointment
PATCH  /api/appointments/:id/complete[Doctor] - Complete appointment
PATCH  /api/appointments/:id/cancel  [Patient/Doctor] - Cancel appointment
PUT    /api/appointments/:id         [Patient] - Reschedule appointment
PATCH  /api/appointments/:id         [Patient] - Reschedule appointment (alternative)
```

### Availability
```
POST   /api/availability             [Doctor] - Add availability slot
GET    /api/availability/me          [Doctor] - Get own availability
GET    /api/availability/:doctorId   [Authenticated] - Get doctor's availability
PATCH  /api/availability/:id         [Doctor] - Update availability slot
DELETE /api/availability/:id         [Doctor] - Delete availability slot
```

## Test Flow

### 1. Register Users
```bash
# Register Patient
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Patient","email":"patient@test.com","password":"password123","role":"patient"}'

# Register Doctor
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Smith","email":"doctor@test.com","password":"password123","role":"doctor"}'

# Register Admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@test.com","password":"password123","role":"admin"}'
```

### 2. Login and Get Tokens
```bash
# Login as Patient
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"password123"}'

# Save the token from response
```

### 3. Doctor Sets Availability
```bash
# Add Monday 9-17
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{"day_of_week":"monday","start_time":"09:00","end_time":"17:00"}'

# Add Tuesday 10-16
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{"day_of_week":"tuesday","start_time":"10:00","end_time":"16:00"}'
```

### 4. Patient Books Appointment
```bash
# Get list of doctors first
curl -X GET http://localhost:5000/api/users/doctors/list \
  -H "Authorization: Bearer PATIENT_TOKEN"

# Book appointment (use doctor ID from above)
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -d '{"doctor_id":"DOCTOR_ID","appointment_date":"2026-02-10","appointment_time":"10:00","reason":"Regular checkup"}'
```

### 5. Patient Reschedules Appointment
```bash
curl -X PUT http://localhost:5000/api/appointments/APPOINTMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -d '{"appointment_date":"2026-02-11","appointment_time":"11:00"}'
```

### 6. Doctor Confirms Appointment
```bash
curl -X PATCH http://localhost:5000/api/appointments/APPOINTMENT_ID/confirm \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

### 7. Patient Cancels Appointment
```bash
curl -X PATCH http://localhost:5000/api/appointments/APPOINTMENT_ID/cancel \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

### 8. Doctor Completes Appointment
```bash
curl -X PATCH http://localhost:5000/api/appointments/APPOINTMENT_ID/complete \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

### 9. Admin Views All Data
```bash
# Get all users
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get all appointments
curl -X GET http://localhost:5000/api/appointments \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Validation Tests

### ✅ Ownership Validation
- Patient can only reschedule their own appointments
- Patient can only cancel their own appointments
- Doctor can only update their own availability

### ✅ Doctor Validation
- Appointment creation validates doctor exists
- Appointment creation validates user has doctor role
- Returns error if invalid doctor ID

### ✅ Availability Validation
- Cannot book appointments outside doctor's availability
- Returns available slots when booking fails
- Supports multiple slots per day per doctor

### ✅ Data Enrichment
- Patient appointments include doctor names
- Doctor appointments include patient names
- Admin appointments include both names
- No raw IDs displayed to users

### ✅ Status Codes
- 200: Success
- 201: Created
- 400: Bad request / validation error
- 401: Unauthorized (no token)
- 403: Forbidden (wrong role or ownership)
- 404: Not found
- 409: Conflict (doctor unavailable)
- 500: Server error

## Complete Flow Test

1. ✅ Register patient, doctor, admin
2. ✅ Login all users
3. ✅ Doctor sets availability (multiple slots)
4. ✅ Patient lists doctors
5. ✅ Patient books appointment
6. ✅ Patient views appointments (sees doctor name)
7. ✅ Doctor views appointments (sees patient name)
8. ✅ Patient reschedules appointment
9. ✅ Doctor confirms appointment
10. ✅ Patient cancels appointment
11. ✅ Admin views all users and appointments
12. ✅ All dashboards work without crashes
