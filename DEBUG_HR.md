# HR Module Debug Guide

## ✅ Verified Working
- Backend server running on port 4000
- Database connected with 2 employees, 3 attendance records
- API routes properly configured
- Authentication system in place

## 🔍 To Debug "Nothing Working"

### 1. Check if you're logged in:
- Open browser DevTools (F12)
- Go to Application/Storage tab → Local Storage
- Look for key `bb_token` - if missing, you need to login

### 2. Check API connectivity:
Open Console and run:
```javascript
fetch('http://localhost:4000/api/hrms/employees', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('bb_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Employees:', d))
.catch(e => console.error('Error:', e))
```

### 3. Check for CORS errors:
- In Console tab, look for red CORS error messages
- Should see successful requests to `http://localhost:4000/api/hrms/*`

### 4. Common Issues:

**Problem:** Can't see any employees
**Solution:** Run seed script: `cd backend && node seed.js`

**Problem:** 401 Unauthorized errors
**Solution:** Login again at `/login`

**Problem:** Can't mark attendance
**Solution:** Make sure you're on the "Field Ops" tab > "Attendance Tracking" subtab

**Problem:** Charts show sizing errors
**Solution:** Already fixed - refresh the page

**Problem:** Date format errors
**Solution:** Already fixed - refresh the page

### 5. Quick API Test:
Run in backend folder:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bridgebreak.com","password":"password123"}'
```

If this returns a token, backend is working!

### 6. Frontend Dev Server:
Make sure Next.js is running on port 3000:
```bash
npm run dev
```
