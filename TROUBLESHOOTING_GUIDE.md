# 🚨 Deployment Troubleshooting Guide

## ❌ Error Analysis

### **🔍 Error Details:**
```
POST https://farmtohome-xhjo.onrender.com/auth/login 404 (Not Found)
```

### **🎯 Root Cause:**
The frontend is deployed and accessible, but the backend API endpoint `/auth/login` is returning 404, which means:

1. **Backend not deployed** OR
2. **Backend deployed at different URL** OR  
3. **API routes not properly configured** OR
4. **CORS issues** blocking requests

## 🔧 Troubleshooting Steps

### **✅ 1. Check Backend Deployment Status:**

#### **A. Verify Backend is Running:**
```bash
# Check if your backend is deployed
curl https://your-backend-url.onrender.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "...",
  "uptime": "..."
}
```

#### **B. Check Render Dashboard:**
1. Go to your Render dashboard
2. Check your backend service status
3. Look for deployment logs
4. Verify environment variables

#### **C. Check API Routes:**
```bash
# Test if auth endpoints exist
curl https://your-backend-url.onrender.com/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Expected: 200 OK with response
# Actual: 404 Not Found
```

### **✅ 2. Frontend Configuration Issues:**

#### **A. Check Frontend API URL:**
```javascript
// In your deployed frontend, check if VITE_API_URL is correct
console.log('API URL:', import.meta.env.VITE_API_URL);

// Should be: https://your-backend-url.onrender.com/api
// Check frontend/.env.production file
```

#### **B. CORS Configuration:**
```javascript
// In backend server.js, check CORS setup
app.use(cors({
  origin: ['https://farmtohome-xhjo.onrender.com', 'http://localhost:5173'],
  credentials: true
}));
```

### **✅ 3. Common Deployment Issues:**

#### **A. Render-Specific Issues:**
```bash
# Render automatically sets PORT
# Your backend should use process.env.PORT (already configured)

# Check Render service name
# Should match your backend service name on Render
```

#### **B. Environment Variables:**
```bash
# Check if environment variables are set on Render
# In Render dashboard: Settings → Environment Variables
# Required: DATABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
```

#### **C. Build Issues:**
```bash
# Check if backend build succeeded
npm run build  # Should have no errors

# Check if start script exists
npm start       # Should start successfully
```

## 🚀 Quick Fixes

### **✅ 1. Immediate Fix - Update Frontend:**
```bash
# Update frontend environment to point to correct backend URL
# Edit frontend/.env.production
VITE_API_URL=https://your-actual-backend-url.onrender.com/api

# Rebuild and redeploy frontend
npm run build
# Deploy dist/ folder to your hosting
```

### **✅ 2. Check Backend Routes:**
```javascript
// Verify auth routes exist in backend/routes/auth.js
router.post('/login', authController.login);        // Should exist
router.post('/register', authController.register);    // Should exist
router.post('/logout', authController.logout);     // Should exist
```

### **✅ 3. Render-Specific Solutions:**
```bash
# Render web service name should match
# Backend: farmtohome-backend
# Frontend: farmtohome-frontend

# Check Render service logs
# In Render dashboard: Logs tab
```

## 📋 Debugging Commands

### **✅ 1. Test Backend Health:**
```bash
curl -I https://your-backend-url.onrender.com/health
# Should return 200 OK
```

### **✅ 2. Test API Endpoints:**
```bash
# Test specific endpoint
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check response headers and status
curl -v https://your-backend-url.onrender.com/api/auth/login
```

### **✅ 3. Check Frontend Network Tab:**
```bash
# In browser dev tools:
# 1. Open Network tab
# 2. Look at failed login request
# 3. Check Request URL and Response status
# 4. Verify API URL is correct
```

## 🎯 Most Likely Issues

### **🔥 Issue 1: Backend Not Deployed**
- **Symptom**: 404 on all API endpoints
- **Fix**: Deploy backend to Render first
- **Check**: Render dashboard for deployment status

### **🔥 Issue 2: Incorrect API URL in Frontend**
- **Symptom**: Frontend calls wrong backend URL
- **Fix**: Update `VITE_API_URL` in production environment
- **Check**: Frontend environment variables on Render

### **🔥 Issue 3: Missing API Routes**
- **Symptom**: Specific endpoints return 404
- **Fix**: Verify route definitions in backend/routes/
- **Check**: Route mounting in backend/app.js

### **🔥 Issue 4: CORS Configuration**
- **Symptom**: CORS errors in browser console
- **Fix**: Update CORS configuration in backend/server.js
- **Check**: Origin includes your frontend domain

## 🚀 Action Plan

### **✅ Step 1: Verify Backend Status**
1. Check Render dashboard for backend deployment
2. Test backend health endpoint
3. Check deployment logs

### **✅ Step 2: Update Frontend Configuration**
1. Update `VITE_API_URL` to correct backend URL
2. Rebuild frontend
3. Redeploy frontend

### **✅ Step 3: Test Integration**
1. Test login endpoint directly
2. Test login through frontend
3. Verify CORS is working

## 📞 Support Resources

### **✅ Render Documentation:**
- [Render Docs](https://render.com/docs)
- [Render Troubleshooting](https://render.com/docs/troubleshooting)

### **✅ Common Issues:**
- [Render Status Page](https://status.render.com)
- [Deployment Guides](https://render.com/docs/deploy-nodejs)

## 🎉 Next Steps

1. **Check your Render dashboard** for backend deployment status
2. **Verify environment variables** are set correctly
3. **Update frontend API URL** to match backend deployment
4. **Test the complete login flow** end-to-end

**The 404 error is solvable! It's likely just a configuration issue that can be fixed quickly.** 🔧
