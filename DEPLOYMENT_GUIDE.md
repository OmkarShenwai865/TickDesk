# TickDesk Deployment Guide (100% FREE)

Complete step-by-step guide to deploy TickDesk - IT Helpdesk & Asset Management System to production using free tier services.

## 🎯 Stack Overview

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Django + Gunicorn)
- **Database**: Neon PostgreSQL (Free Tier)
- **File Storage**: Cloudinary (Free Tier)
- **Repository**: GitHub

---

## 📋 Prerequisites

1. GitHub account
2. Vercel account (sign up with GitHub)
3. Render account (sign up with GitHub)
4. Neon account (for PostgreSQL)
5. Cloudinary account

---

## 🚀 Step-by-Step Deployment

### **Phase 1: Setup GitHub Repository**

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Update .gitignore** to ensure sensitive files are not pushed:
   ```
   backend/.env
   backend/db.sqlite3
   backend/media/
   frontend/.env.local
   ```

---

### **Phase 2: Setup Neon PostgreSQL Database**

1. Go to [https://neon.tech](https://neon.tech) and sign up
2. Click **"Create a project"**
3. Project settings:
   - Name: `tickdesk-db`
   - Region: Choose closest to your location
   - PostgreSQL version: Latest (16)
4. Click **"Create project"**
5. **IMPORTANT**: Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
6. Keep this tab open - you'll need this URL!

---

### **Phase 3: Setup Cloudinary (File Storage)**

1. Go to [https://cloudinary.com](https://cloudinary.com) and sign up
2. After login, go to **Dashboard**
3. You'll see:
   - **Cloud Name**: `dxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnop` (click the eye icon to reveal)
4. **Copy these 3 values** - you'll need them for environment variables

---

### **Phase 4: Deploy Backend to Render**

#### Option A: Using render.yaml (Recommended)

1. Go to [https://render.com](https://render.com) and sign in with GitHub
2. Click **"New" → "Blueprint"**
3. Connect your GitHub repository (`TickDesk`)
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**
6. **Set Environment Variables**:
   - Go to your service → **Environment**
   - Add these variables:

   ```
   ALLOWED_HOSTS=your-app-name.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   PLATFORM_NOTIFY_EMAIL=admin-email@example.com
   ```

#### Option B: Manual Setup

1. Go to [https://render.com](https://render.com)
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repository
4. Settings:
   - **Name**: `tickdesk-backend`
   - **Region**: Oregon (US West) - free tier
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`
   - **Plan**: Free
5. **Environment Variables** - Add all from above
6. Click **"Create Web Service"**

7. **Wait for deployment** (5-10 minutes first time)
8. Once deployed, copy your backend URL: `https://tickdesk-backend.onrender.com`

---

### **Phase 5: Create Django Superuser**

After backend is deployed:

1. Go to Render Dashboard → Your service → **Shell**
2. Run:
   ```bash
   cd backend
   python manage.py createsuperuser
   ```
3. Follow prompts to create admin user
4. Test admin panel: `https://your-backend.onrender.com/admin`

---

### **Phase 6: Deploy Frontend to Vercel**

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New" → "Project"**
3. Import your GitHub repository (`TickDesk`)
4. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - Click **"Environment Variables"**
   - Add:
     ```
     VITE_API_URL=https://your-backend.onrender.com/api/
     ```
   - Replace `your-backend` with your actual Render URL
6. Click **"Deploy"**
7. Wait 2-3 minutes for deployment
8. Copy your Vercel URL: `https://tickdesk-xyz.vercel.app`

---

### **Phase 7: Update CORS Settings**

1. Go back to **Render** → Your backend service → **Environment**
2. Update `CORS_ALLOWED_ORIGINS`:
   ```
   https://tickdesk-xyz.vercel.app,http://localhost:5173
   ```
   (Use your actual Vercel URL)
3. Click **"Save Changes"**
4. Service will auto-redeploy

---

### **Phase 8: Testing**

1. Visit your Vercel frontend URL
2. Try to:
   - Register a new account
   - Login
   - Create a ticket
   - Upload a file (it should go to Cloudinary)
   - Check email notifications (if configured)

---

## 🔧 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs: Dashboard → Your service → Logs
- Verify all environment variables are set
- Check `DATABASE_URL` is correct

**"502 Bad Gateway"**
- Service is starting (first request takes 30-50s on free tier)
- Wait and refresh

**Database connection errors**
- Verify Neon connection string includes `?sslmode=require`
- Check Neon database is active (not paused)

### Frontend Issues

**"Network Error" or API not connecting**
- Verify `VITE_API_URL` in Vercel environment variables
- Check CORS settings on backend
- Ensure backend URL ends with `/api/`

**Build fails**
- Check Node version (should use latest LTS)
- Try running `npm install` locally first

### File Upload Issues

**Files not uploading**
- Verify Cloudinary credentials in Render
- Check Cloudinary dashboard for uploads
- Ensure `DEFAULT_FILE_STORAGE` is set correctly

---

## 📝 Important Notes

### Free Tier Limitations

**Render (Backend)**:
- Spins down after 15 minutes of inactivity
- First request takes 30-50 seconds to wake up
- 750 hours/month free (enough for 1 app)

**Neon (Database)**:
- 3GB storage
- Pauses after 7 days of inactivity
- Always-available with free tier

**Cloudinary**:
- 25GB storage
- 25GB bandwidth/month
- More than enough for student projects

**Vercel (Frontend)**:
- Unlimited bandwidth
- 100GB free per month
- No sleep/wake delays

### Security Best Practices

1. **Never commit `.env` files** to GitHub
2. **Use strong SECRET_KEY** in production
3. **Keep API credentials secure**
4. **Enable 2FA** on all service accounts

---

## 🔄 Updating Your Deployment

### Backend Updates
1. Push code to GitHub
2. Render auto-deploys from main branch
3. Check logs for errors

### Frontend Updates
1. Push code to GitHub
2. Vercel auto-deploys from main branch
3. Preview deployment before promoting to production

---

## 🎓 For Your Resume

**What to highlight**:
- **Comprehensive IT Management Platform** (Helpdesk + Asset Management)
- Full-stack application with React + Django REST Framework
- Complex business logic with multiple modules (tickets, assets, users, notifications)
- RESTful API with JWT authentication
- Role-based access control (RBAC)
- Cloud deployment on modern platforms (Render + Vercel)
- PostgreSQL database with relational data modeling
- Cloud storage integration (Cloudinary)
- CI/CD with automatic deployments
- Production-ready configuration with security best practices

**Live Demo Links**:
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.onrender.com/api/`
- GitHub: `https://github.com/yourusername/TickDesk`

---

## 🆘 Need Help?

**Common Resources**:
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Cloudinary Docs: https://cloudinary.com/documentation

**If deployment fails**:
1. Check service logs first
2. Verify all environment variables
3. Test backend with `/admin` endpoint
4. Test frontend API calls in browser console

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Neon PostgreSQL database created
- [ ] Cloudinary account setup
- [ ] Backend deployed to Render
- [ ] Environment variables configured
- [ ] Database migrated successfully
- [ ] Django superuser created
- [ ] Frontend deployed to Vercel
- [ ] CORS settings updated
- [ ] File uploads working (Cloudinary)
- [ ] Authentication tested
- [ ] Email notifications tested (if configured)

---

**🎉 Congratulations! Your TickDesk application is now live and ready to showcase to potential employers!**
