# Security Quick Reference

## 🔐 Password Requirements

```
✅ Minimum 8 characters
✅ At least one uppercase letter
✅ At least one lowercase letter
✅ At least one number
✅ Maximum 128 characters
```

**Valid:** `Password123`, `MySecure1Pass`  
**Invalid:** `password`, `PASSWORD`, `Pass1`

## 🚦 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/register) | 5 | 15 min |
| Password reset | 3 | 1 hour |
| Create appointment | 10 | 1 hour |
| General API | 100 | 15 min |

## 📝 Validation Schemas

### Register
```javascript
{
  name: string (2-100 chars),
  email: valid email,
  password: strong password,
  role: 'patient' | 'doctor' | 'admin'
}
```

### Login
```javascript
{
  email: valid email,
  password: string
}
```

### Create Appointment
```javascript
{
  doctor_id: MongoDB ObjectId,
  appointment_date: ISO 8601 date (future),
  appointment_time: HH:MM format,
  reason: string (5-500 chars)
}
```

### Add Availability
```javascript
{
  day_of_week: 'monday' | 'tuesday' | ... | 'sunday',
  start_time: HH:MM format,
  end_time: HH:MM format (> start_time)
}
```

## 🔍 Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Invalid credentials"
}
```

### Forbidden (403)
```json
{
  "error": "You can only reschedule your own appointments"
}
```

### Not Found (404)
```json
{
  "error": "Appointment not found"
}
```

### Conflict (409)
```json
{
  "error": "Doctor not available at selected time",
  "available_slots": [...]
}
```

### Rate Limited (429)
```json
{
  "error": "Too many authentication attempts",
  "message": "Please try again after 15 minutes"
}
```

## 📄 Pagination

### Request
```
GET /api/appointments/patient?page=1&limit=20
```

### Response
```json
{
  "appointments": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Defaults
- `page`: 1
- `limit`: 20
- `max limit`: 100

## 🌐 CORS

### Allowed Origins
```javascript
http://localhost:5173
http://localhost:3000
${FRONTEND_URL}
```

### Add New Origin
Edit `backend/src/server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-domain.com', // Add here
  process.env.FRONTEND_URL,
].filter(Boolean);
```

## 🔑 Environment Variables

### Required
```bash
MONGO_URI=mongodb://localhost:27017/healthvillage
JWT_SECRET=your-secret-key-min-32-characters
```

### Optional
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

## 🛡️ Security Headers

Automatically set by Helmet.js:
- X-DNS-Prefetch-Control
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

## 🔒 Best Practices

### DO ✅
- Use strong passwords
- Validate all inputs
- Check ownership before modify
- Use pagination for lists
- Handle errors properly
- Log errors server-side only
- Use HTTPS in production
- Set NODE_ENV=production

### DON'T ❌
- Expose sensitive data in logs
- Return stack traces to clients
- Use weak passwords
- Skip validation
- Allow unbounded queries
- Trust user input
- Use wildcard CORS
- Hardcode secrets

## 🧪 Testing

### Test Password Validation
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Password123","role":"patient"}'
```

### Test Rate Limiting
```bash
# Run 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Pagination
```bash
curl "http://localhost:5000/api/appointments/patient?page=1&limit=5" \
  -H "Authorization: Bearer TOKEN"
```

## 📊 Monitoring

### Key Metrics
- Failed login attempts
- Rate limit hits
- 401/403 errors
- API response times
- Database query times

### Alert Thresholds
- Failed logins > 10/min
- Rate limits > 50/min
- Error rate > 5%
- Response time > 1s
- CPU > 80%

## 🚨 Common Issues

### "Validation failed"
**Cause:** Input doesn't meet requirements  
**Fix:** Check error details, adjust input

### "Too many requests"
**Cause:** Rate limit exceeded  
**Fix:** Wait for window to reset

### "Not allowed by CORS"
**Cause:** Origin not in whitelist  
**Fix:** Add origin to allowedOrigins

### "Invalid ID format"
**Cause:** Not a valid MongoDB ObjectId  
**Fix:** Use 24-character hex string

## 📞 Support

### Documentation
- `SECURITY_HARDENING_COMPLETE.md` - Full details
- `SECURITY_MIGRATION_GUIDE.md` - Migration help
- `SECURITY_AUDIT_SUMMARY.md` - Overview

### Quick Links
- Validation schemas: `middleware/validation.middleware.js`
- Rate limits: `middleware/rateLimiter.middleware.js`
- Error handling: `middleware/errorHandler.middleware.js`
- CORS config: `server.js`

---

**Last Updated:** February 8, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
