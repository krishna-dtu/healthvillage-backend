# API Quick Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/*` require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints Summary

### 🔐 Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### 👥 Users
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | Get all users |
| GET | `/users/:id` | Any | Get user by ID |
| GET | `/users/doctors/list` | Any | Get all doctors |

### 📅 Appointments
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/appointments` | Patient | Create appointment |
| GET | `/appointments` | Admin | Get all appointments |
| GET | `/appointments/patient` | Patient | Get my appointments |
| GET | `/appointments/doctor` | Doctor | Get my appointments |
| PUT | `/appointments/:id` | Patient | Reschedule appointment |
| PATCH | `/appointments/:id` | Patient | Reschedule appointment |
| PATCH | `/appointments/:id/confirm` | Doctor | Confirm appointment |
| PATCH | `/appointments/:id/complete` | Doctor | Complete appointment |
| PATCH | `/appointments/:id/cancel` | Patient/Doctor | Cancel appointment |

### 🕐 Availability
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/availability` | Doctor | Add availability slot |
| GET | `/availability/me` | Doctor | Get my availability |
| GET | `/availability/:doctorId` | Any | Get doctor's availability |
| PATCH | `/availability/:id` | Doctor | Update availability slot |
| DELETE | `/availability/:id` | Doctor | Delete availability slot |

## Request/Response Examples

### Register User
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient"  // or "doctor" or "admin"
}

Response 201:
{
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

Response 200:
{
  "message": "User login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Get Doctors List
```json
GET /api/users/doctors/list
Headers: Authorization: Bearer TOKEN

Response 200:
[
  {
    "_id": "doctor_id_1",
    "name": "Dr. Smith",
    "email": "smith@example.com",
    "role": "doctor"
  },
  {
    "_id": "doctor_id_2",
    "name": "Dr. Jones",
    "email": "jones@example.com",
    "role": "doctor"
  }
]
```

### Add Availability
```json
POST /api/availability
Headers: Authorization: Bearer DOCTOR_TOKEN
{
  "day_of_week": "monday",
  "start_time": "09:00",
  "end_time": "17:00"
}

Response 201:
{
  "message": "Availability added successfully",
  "availabilityId": "uuid"
}
```

### Book Appointment
```json
POST /api/appointments
Headers: Authorization: Bearer PATIENT_TOKEN
{
  "doctor_id": "doctor_uuid",
  "appointment_date": "2026-02-10",
  "appointment_time": "10:00",
  "reason": "Regular checkup"
}

Response 201:
{
  "message": "Appointment created successfully",
  "appointmentId": "uuid"
}

Response 409 (Doctor Unavailable):
{
  "error_code": "DOCTOR_UNAVAILABLE",
  "message": "Doctor not available at selected time",
  "available_slots": [
    {
      "date": "2026-02-10",
      "time": "09:00",
      "datetime": "2026-02-10T09:00:00.000Z"
    },
    {
      "date": "2026-02-10",
      "time": "11:00",
      "datetime": "2026-02-10T11:00:00.000Z"
    }
  ]
}
```

### Get Patient Appointments
```json
GET /api/appointments/patient
Headers: Authorization: Bearer PATIENT_TOKEN

Response 200:
{
  "appointments": [
    {
      "_id": "apt_id",
      "doctorId": "doctor_id",
      "doctorName": "Dr. Smith",
      "appointment_date": "2026-02-10",
      "appointment_time": "10:00",
      "reason": "Regular checkup",
      "status": "scheduled",
      "createdAt": "2026-02-08T10:00:00.000Z",
      "updatedAt": "2026-02-08T10:00:00.000Z"
    }
  ]
}
```

### Reschedule Appointment
```json
PUT /api/appointments/:id
Headers: Authorization: Bearer PATIENT_TOKEN
{
  "appointment_date": "2026-02-11",
  "appointment_time": "11:00"
}

Response 200:
{
  "message": "Appointment rescheduled successfully"
}

Response 403 (Not Owner):
{
  "error": "You can only reschedule your own appointments"
}
```

### Confirm Appointment
```json
PATCH /api/appointments/:id/confirm
Headers: Authorization: Bearer DOCTOR_TOKEN

Response 200:
{
  "message": "Appointment confirmed"
}
```

### Cancel Appointment
```json
PATCH /api/appointments/:id/cancel
Headers: Authorization: Bearer PATIENT_TOKEN

Response 200:
{
  "message": "Appointment cancelled"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (wrong role or not owner) |
| 404 | Not Found |
| 409 | Conflict (doctor unavailable) |
| 500 | Server Error |

## Common Error Responses

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied: insufficient permissions"
}
```

### 400 Bad Request
```json
{
  "message": "Failed to create appointment",
  "error": "Cannot book appointment in the past"
}
```

## Validation Rules

### Appointments
- ✅ Doctor must exist and have doctor role
- ✅ Date/time must be in the future
- ✅ Must be within doctor's availability
- ✅ No duplicate bookings
- ✅ Patient can only modify their own appointments

### Availability
- ✅ Time format: HH:MM (24-hour)
- ✅ Start time < end time
- ✅ Valid weekday: monday-sunday
- ✅ Doctor can only modify their own availability

### Users
- ✅ Email must be unique
- ✅ Password minimum 6 characters
- ✅ Role must be: patient, doctor, or admin
