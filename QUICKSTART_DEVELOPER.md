# Backend Developer Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGO_URI=mongodb://localhost:27017/healthvillage
# JWT_SECRET=your-secret-key-here
```

### 3. Start Server
```bash
npm start
```

Server runs on `http://localhost:5000`

### 4. Test Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok"}
```

## 📚 Quick API Reference

### Register & Login
```bash
# Register a patient
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "patient@test.com",
    "password": "password123",
    "role": "patient"
  }'

# Register a doctor
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Smith",
    "email": "doctor@test.com",
    "password": "password123",
    "role": "doctor"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "password123"
  }'

# Save the token from response!
```

### Set Doctor Availability
```bash
# Add Monday 9-17
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "day_of_week": "monday",
    "start_time": "09:00",
    "end_time": "17:00"
  }'
```

### Book Appointment
```bash
# List doctors
curl -X GET http://localhost:5000/api/users/doctors/list \
  -H "Authorization: Bearer PATIENT_TOKEN"

# Book appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -d '{
    "doctor_id": "DOCTOR_ID_FROM_LIST",
    "appointment_date": "2026-02-10",
    "appointment_time": "10:00",
    "reason": "Regular checkup"
  }'
```

### View Appointments
```bash
# Patient views their appointments
curl -X GET http://localhost:5000/api/appointments/patient \
  -H "Authorization: Bearer PATIENT_TOKEN"

# Doctor views their appointments
curl -X GET http://localhost:5000/api/appointments/doctor \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

## 🔑 Key Endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register user |
| `/api/auth/login` | POST | Public | Login |
| `/api/users/doctors/list` | GET | Any | List doctors |
| `/api/availability` | POST | Doctor | Add availability |
| `/api/availability/me` | GET | Doctor | View own availability |
| `/api/appointments` | POST | Patient | Book appointment |
| `/api/appointments/patient` | GET | Patient | View my appointments |
| `/api/appointments/doctor` | GET | Doctor | View my appointments |
| `/api/appointments/:id` | PUT | Patient | Reschedule |
| `/api/appointments/:id/confirm` | PATCH | Doctor | Confirm |
| `/api/appointments/:id/complete` | PATCH | Doctor | Complete |
| `/api/appointments/:id/cancel` | PATCH | Patient/Doctor | Cancel |

## 📖 Full Documentation

- **API Reference:** `backend/API_QUICK_REFERENCE.md`
- **Test Guide:** `backend/API_TEST_GUIDE.md`
- **Verification:** `backend/FINAL_VERIFICATION.md`
- **Deployment:** `backend/MIGRATION_NOTES.md`

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT authentication
│   │   └── rbac.middleware.js      # Role-based access control
│   ├── models/
│   │   ├── User.js                 # User model
│   │   ├── Appointment.js          # Appointment model
│   │   └── DoctorAvailability.js   # Availability model
│   ├── modules/
│   │   ├── auth/                   # Authentication
│   │   ├── users/                  # User management
│   │   ├── appointments/           # Appointments
│   │   └── availability/           # Doctor availability
│   ├── routes/
│   │   └── index.js                # Main router
│   ├── utils/
│   │   ├── db.js                   # Database utilities
│   │   ├── jwt.js                  # JWT utilities
│   │   └── encryption.js           # Password utilities
│   └── server.js                   # Entry point
├── .env                            # Environment variables
└── package.json                    # Dependencies
```

## 🔐 Authentication

All protected endpoints require JWT token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token from login response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

## 🎭 User Roles

- **patient** - Can book, reschedule, cancel appointments
- **doctor** - Can view, confirm, complete appointments; manage availability
- **admin** - Can view all users and appointments

## ✅ Validation Rules

### Appointments
- ✅ Doctor must exist and have doctor role
- ✅ Date/time must be in future
- ✅ Must be within doctor's availability
- ✅ No duplicate bookings
- ✅ Patient can only modify own appointments

### Availability
- ✅ Time format: HH:MM (24-hour)
- ✅ Start time < end time
- ✅ Valid weekday: monday-sunday
- ✅ Doctor can only modify own availability

## 🐛 Common Issues

### "Doctor not found"
- Ensure doctor user exists
- Ensure user has role='doctor'

### "You can only reschedule your own appointments"
- Patient trying to modify another patient's appointment
- Check token is for correct user

### "Doctor not available at selected time"
- Doctor has no availability for that day/time
- Check available slots in error response

### 404 on /api/users/doctors
- Use `/api/users/doctors/list` (not `/api/users/doctors`)

## 🧪 Testing

### Run Tests
```bash
# Start server
npm start

# In another terminal, run tests
curl http://localhost:5000/health
```

### Test Complete Flow
See `backend/API_TEST_GUIDE.md` for complete test scenarios.

## 📊 Database

### MongoDB Collections
- `users` - All users (patients, doctors, admins)
- `appointments` - All appointments
- `doctoravailabilities` - Doctor availability slots

### Indexes
```javascript
// Appointments
db.appointments.createIndex({ patientId: 1 })
db.appointments.createIndex({ doctorId: 1 })

// Availability
db.doctoravailabilities.createIndex({ doctorId: 1 })
```

## 🚨 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong role/ownership) |
| 404 | Not found |
| 409 | Conflict (doctor unavailable) |
| 500 | Server error |

## 💡 Tips

1. **Use Postman/Insomnia** for easier API testing
2. **Save tokens** in environment variables
3. **Check logs** for detailed error messages
4. **Read error responses** - they include helpful info
5. **Use available_slots** from 409 errors for rebooking

## 🔗 Related Files

- Frontend: `frontend/src/lib/api.ts`
- Models: `backend/src/models/`
- Routes: `backend/src/routes/index.js`
- Middleware: `backend/src/middleware/`

## 🎯 Next Steps

1. ✅ Start backend server
2. ✅ Register test users (patient, doctor, admin)
3. ✅ Set doctor availability
4. ✅ Book test appointment
5. ✅ Test complete workflow
6. ✅ Integrate with frontend

## 📞 Support

For issues or questions:
1. Check `backend/API_TEST_GUIDE.md`
2. Check `backend/FINAL_VERIFICATION.md`
3. Review error messages in console
4. Check MongoDB connection

---

**Happy Coding!** 🎉
