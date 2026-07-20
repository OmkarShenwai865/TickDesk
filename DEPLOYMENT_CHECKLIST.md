# 🚀 TickDesk Deployment Checklist

IT Helpdesk & Asset Management System - Use this checklist to track your deployment progress.

## ✅ Pre-Deployment

### Code Preparation
- [ ] All code committed to GitHub
- [ ] `.gitignore` properly configured
- [ ] No sensitive data (passwords, keys) in repository
- [ ] `.env.example` files created (backend & frontend)
- [ ] Production settings file created ([config/settings_production.py](backend/config/settings_production.py))
- [ ] Build script created and executable ([build.sh](backend/build.sh))

### Testing Local Setup
- [ ] Backend runs locally with SQLite
- [ ] Frontend connects to local backend
- [ ] User authentication works
- [ ] Ticket creation/management works
- [ ] File uploads work locally

---

## 🗄️ Database Setup (Neon PostgreSQL)

- [ ] Neon account created
- [ ] Database project created
- [ ] Connection string copied
- [ ] Connection string saved securely (don't commit!)
- [ ] Connection string format verified: `postgresql://...?sslmode=require`

**Database URL**: `postgresql://user:password@host/database?sslmode=require`

---

## ☁️ File Storage Setup (Cloudinary)

- [ ] Cloudinary account created
- [ ] Cloud Name noted: `________________`
- [ ] API Key noted: `________________`
- [ ] API Secret noted (keep secure!): `________________`
- [ ] Credentials saved securely

---

## 🔧 Backend Deployment (Render)

### Service Creation
- [ ] Render account created (sign in with GitHub)
- [ ] GitHub repository connected
- [ ] Web Service created
- [ ] Service name: `tickdesk-backend` (or your choice)
- [ ] Region selected: Oregon (US West) for free tier
- [ ] Runtime: Python 3
- [ ] Build command: `./backend/build.sh`
- [ ] Start command: `cd backend && gunicorn config.wsgi:application`

### Environment Variables Set
- [ ] `DJANGO_SETTINGS_MODULE=config.settings_production`
- [ ] `SECRET_KEY` (auto-generated or custom)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS=your-app.onrender.com`
- [ ] `DATABASE_URL` (from Neon)
- [ ] `CORS_ALLOWED_ORIGINS` (will update after frontend)
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `EMAIL_HOST_USER` (optional)
- [ ] `EMAIL_HOST_PASSWORD` (optional)
- [ ] `DEFAULT_FROM_EMAIL` (optional)
- [ ] `PLATFORM_NOTIFY_EMAIL` (optional)

### Deployment Verification
- [ ] First build completed successfully (check logs)
- [ ] No build errors in Render logs
- [ ] Backend URL accessible: `https://your-backend.onrender.com`
- [ ] Admin panel loads: `https://your-backend.onrender.com/admin/`

### Database Setup
- [ ] Django migrations ran successfully
- [ ] Superuser created via Render Shell
- [ ] Can login to admin panel
- [ ] Test user created (optional)

**Backend URL**: `https://______________________.onrender.com`

---

## 🌐 Frontend Deployment (Vercel)

### Project Setup
- [ ] Vercel account created (sign in with GitHub)
- [ ] GitHub repository connected
- [ ] Project imported
- [ ] Framework preset: Vite
- [ ] Root directory: `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### Environment Variables Set
- [ ] `VITE_API_URL=https://your-backend.onrender.com/api/`
  - ⚠️ Must end with `/api/`
  - ⚠️ Use your actual backend URL

### Deployment Verification
- [ ] Build completed successfully
- [ ] Frontend accessible: `https://your-app.vercel.app`
- [ ] No console errors in browser
- [ ] API calls working (check Network tab)

**Frontend URL**: `https://______________________.vercel.app`

---

## 🔄 CORS Configuration Update

After frontend is deployed:
- [ ] Go to Render → Backend service → Environment
- [ ] Update `CORS_ALLOWED_ORIGINS`:
  ```
  https://your-frontend.vercel.app,http://localhost:5173
  ```
- [ ] Save changes (triggers automatic redeploy)
- [ ] Wait for redeploy to complete (~2-3 minutes)
- [ ] Refresh frontend and test API calls

---

## 🧪 Testing Deployed Application

### Authentication
- [ ] Register new user works
- [ ] Login works
- [ ] JWT tokens stored in localStorage
- [ ] Logout works
- [ ] Token refresh works (wait 8 hours or test manually)

### Help Desk - Tickets
- [ ] Create new ticket
- [ ] View ticket list
- [ ] Update ticket status
- [ ] Assign ticket to agent
- [ ] Add comment to ticket
- [ ] Filter/search tickets

### Asset Management
- [ ] Create new asset
- [ ] View asset list
- [ ] Assign asset to employee
- [ ] Update asset status
- [ ] Track asset history
- [ ] Filter/search assets by category

### File Uploads
- [ ] Upload file to ticket
- [ ] File appears in Cloudinary dashboard
- [ ] File URL is accessible
- [ ] File download works
- [ ] Multiple files can be uploaded

### User Management (Admin)
- [ ] Create new user (Admin panel)
- [ ] Assign roles
- [ ] Edit user details
- [ ] View user list

### Notifications
- [ ] Email notifications sent (if configured)
- [ ] In-app notifications work

### Performance
- [ ] First load after sleep: ~30-50 seconds (Render free tier)
- [ ] Subsequent loads: Fast (<2 seconds)
- [ ] Images load from Cloudinary
- [ ] No CORS errors in console

---

## 📱 Mobile Testing (Optional)

- [ ] Responsive design works on mobile
- [ ] Login works on mobile
- [ ] Ticket creation works on mobile
- [ ] File upload works on mobile

---

## 🔒 Security Verification

- [ ] DEBUG is False in production
- [ ] SECRET_KEY is unique and strong
- [ ] No credentials in GitHub repository
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] CORS properly configured (only your domains)
- [ ] Admin panel requires authentication
- [ ] JWT tokens expire correctly

---

## 📝 Documentation & Portfolio

### Repository
- [ ] README.md updated with live demo links
- [ ] Clear setup instructions in README
- [ ] License added (if needed)
- [ ] `.env.example` files committed
- [ ] Screenshots added (optional)

### For Resume/Portfolio
- [ ] Live demo URL added to resume
- [ ] GitHub repository URL added
- [ ] Project description written
- [ ] Technologies listed:
  - Frontend: React, Vite, Axios
  - Backend: Django, DRF, JWT
  - Database: PostgreSQL
  - Cloud: Render, Vercel, Cloudinary, Neon
  - Features: IT Helpdesk, Asset Management, RBAC, Real-time Chat, Notifications

---

## 🐛 Troubleshooting Completed

If you encountered issues, mark what you fixed:

- [ ] Backend 502 errors (service starting up)
- [ ] CORS errors (origins not matching)
- [ ] Database connection errors (SSL mode)
- [ ] File upload failures (Cloudinary credentials)
- [ ] Build failures (dependencies)
- [ ] Static files not loading (collectstatic)
- [ ] Email not sending (SMTP settings)

---

## 🎉 Final Verification

### Smoke Test Checklist
Run through this complete flow:

1. [ ] Visit frontend URL
2. [ ] Register a new account
3. [ ] Login with new account
4. [ ] Create a new ticket with file attachment
5. [ ] Check Cloudinary dashboard for uploaded file
6. [ ] Create a new asset (laptop, monitor, etc.)
7. [ ] Assign asset to yourself
8. [ ] Logout
9. [ ] Login as admin
10. [ ] View the new ticket
11. [ ] Assign ticket to an agent
12. [ ] Update ticket status
13. [ ] Add a comment
14. [ ] View asset list and assigned assets
15. [ ] Check email notification (if configured)

**If all steps pass: ✅ DEPLOYMENT SUCCESSFUL!**

---

## 📊 Post-Deployment Monitoring

### Week 1 Check
- [ ] Application still running after 7 days
- [ ] No unexpected errors in logs
- [ ] Database still accessible (Neon auto-suspend check)
- [ ] Cloudinary storage usage: ____GB / 25GB

### Issues to Watch
- [ ] Render service sleep/wake time acceptable
- [ ] No memory issues on free tier
- [ ] Database size under limit
- [ ] Cloudinary bandwidth under limit

---

## 🔗 Important Links

Save these for future reference:

- **GitHub Repo**: `https://github.com/yourusername/TickDesk`
- **Frontend**: `https://______________________.vercel.app`
- **Backend**: `https://______________________.onrender.com`
- **Backend Admin**: `https://______________________.onrender.com/admin/`
- **Render Dashboard**: `https://dashboard.render.com`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Neon Dashboard**: `https://console.neon.tech`
- **Cloudinary Dashboard**: `https://console.cloudinary.com`

---

## 🎓 What You Learned

Reflect on what you accomplished:

- [ ] Full-stack deployment process
- [ ] Environment variable management
- [ ] Database migration (SQLite → PostgreSQL)
- [ ] Cloud storage integration
- [ ] CI/CD with automatic deployments
- [ ] CORS configuration
- [ ] Production security best practices
- [ ] Debugging production issues
- [ ] Cloud platform usage (Render, Vercel, Neon, Cloudinary)

---

**Congratulations on deploying your first full-stack application! 🎉**

This is a major accomplishment for your portfolio and will be valuable during job interviews!
