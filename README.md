# TickDesk - IT Helpdesk & Asset Management System

A comprehensive IT management platform combining help desk ticketing with asset tracking and management. Built with Django REST Framework and React.

## 🚀 Features

### Help Desk Management
- **Ticket System**: Create, assign, track, and resolve support tickets
- **Real-time Chat**: Communicate within tickets for faster resolution
- **Priority & Status Tracking**: Manage ticket urgency and workflow
- **File Attachments**: Upload and manage ticket-related files
- **Notifications**: Email and in-app notifications for updates

### Asset Management
- **Asset Tracking**: Comprehensive inventory of hardware and software assets
- **Asset Assignment**: Assign assets to employees and track ownership
- **Asset Lifecycle Management**: Monitor asset status and maintenance
- **Asset Categories**: Organize assets by type, department, location
- **Asset History**: Track changes and assignment history

### User & Access Management
- **Role-based Access Control**: Admin, Agent, and Employee roles
- **Department Management**: Organize users by departments
- **User Profiles**: Manage user information and permissions
- **Master Admin**: Dedicated super-admin role for platform management

### Reporting & Analytics
- **Dashboard**: Real-time insights into tickets and assets
- **Reports**: Generate detailed reports on helpdesk and asset metrics
- **Analytics**: Track performance, response times, and asset utilization

## 🛠️ Tech Stack

### Backend
- Django 6.0.6
- Django REST Framework
- JWT Authentication
- PostgreSQL (Production)
- SQLite (Development)

### Frontend
- React 19
- Vite
- Axios
- React Router
- Lucide Icons

### Deployment
- Backend: Render (Free Tier)
- Frontend: Vercel (Free Tier)
- Database: Neon PostgreSQL (Free Tier)
- File Storage: Cloudinary (Free Tier)

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Git

## 🏃 Local Development Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TickDesk/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

Frontend will be available at: `http://localhost:5173`

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deploy Steps:
1. Setup Neon PostgreSQL database
2. Setup Cloudinary account
3. Deploy backend to Render
4. Deploy frontend to Vercel
5. Configure environment variables

## 📁 Project Structure

```
TickDesk/
├── backend/
│   ├── accounts/          # User authentication & management
│   ├── tickets/           # Ticket system
│   ├── assets/            # Asset management
│   ├── dashboard/         # Dashboard & analytics
│   ├── reports/           # Reporting functionality
│   ├── notifications/     # Notification system
│   ├── platform_admin/    # Admin features
│   ├── config/            # Django settings
│   ├── manage.py
│   ├── requirements.txt
│   └── build.sh          # Render build script
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── DEPLOYMENT_GUIDE.md    # Detailed deployment guide
├── ENV_VARIABLES_REFERENCE.md  # Environment variables reference
└── README.md
```

## 🔑 Default Users (Development)

After running migrations and creating superuser, you can create test users:

**Admin/Master Admin:**
- Access to all features
- User management
- System configuration

**Agent:**
- Ticket management
- Asset management
- Reports access

**Employee:**
- Create tickets
- View own tickets
- Update ticket status

## 📚 API Documentation

API endpoints are available at: `http://localhost:8000/api/`

### Main Endpoints:
- `/api/accounts/` - User authentication
- `/api/tickets/` - Ticket management
- `/api/assets/` - Asset management
- `/api/dashboard/` - Dashboard data
- `/api/notifications/` - Notifications

## 🤝 Contributing

This is a student project for learning purposes. Feel free to fork and experiment!

## 📧 Contact

For questions or feedback, reach out via GitHub issues.

## 📝 License

This project is for educational purposes.

## 🎓 For Recruiters

This project demonstrates:
- **Full-stack development** (Django + React)
- **RESTful API design** with Django REST Framework
- **Complex business logic** (Helpdesk + Asset Management integration)
- **JWT authentication** with token refresh
- **Role-based access control** (RBAC) for multi-user system
- **Cloud deployment** on modern platforms (Render + Vercel)
- **Database management** (PostgreSQL with complex relationships)
- **Cloud storage integration** (Cloudinary for file handling)
- **Modern frontend** (React 19 + Vite)
- **Responsive design** for desktop and mobile
- **Version control** with Git/GitHub

**Live Demo**: https://tickdesk-app.vercel.app/

---

Built with ❤️ as a learning project
