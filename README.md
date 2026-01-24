# E-Hospital Management System

A comprehensive web-based E-Hospital Management System designed to digitalize healthcare operations and enhance service delivery through modern technology solutions.

**Final Year Project - Computer Science Department**  
**University of Ilorin, Nigeria**  
**Student: Obijole Oluwadamilola Oluwanifemi (22/01dl089)**  
**Supervisor: Dr. Amos Bajeh**

---

## Overview

This E-Hospital Management System leverages modern web technologies to create a secure, scalable, and user-friendly platform that addresses the limitations of traditional manual healthcare management processes.
- dedicated to my School (uniilorin).

### Key Features

- **Electronic Health Records (EHR) Management** - Digital patient records with complete medical history
- **Automated Appointment Scheduling** - Online booking with calendar integration and queue management
- **Role-Based Access Control** - Secure multi-user platform for Patients, Doctors, and Administrators
- **Automated Notification System** - SMS and Email notifications for appointments and alerts
- **Interactive Data Visualization Dashboard** - Real-time analytics with charts and reports
- **Prescription Management** - Digital prescription generation and tracking
- **Real-Time Reporting** - Comprehensive analytics and performance metrics
- **Mobile-Responsive Design** - Seamless experience across all devices

---

## Technology Stack

### Frontend
- **Framework:** React.js 18+ with TypeScript
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI (MUI)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Charts:** Chart.js, D3.js
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with bcrypt
- **Validation:** Joi
- **Email Service:** Nodemailer / SendGrid
- **SMS Service:** Twilio API
- **File Storage:** Cloudinary
- **Testing:** Jest, Supertest

### DevOps
- **Version Control:** Git & GitHub
- **CI/CD:** GitHub Actions
- **Frontend Hosting:** Vercel / Netlify
- **Backend Hosting:** Railway / Render
- **Database Hosting:** MongoDB Atlas

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                   (React.js Application)                     │
│            Patients | Doctors | Administrators              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                         │
│                  (Node.js + Express.js)                      │
│   ┌─────────────┬─────────────┬──────────────────────────┐ │
│   │   Auth      │  Business   │    Notification          │ │
│   │   Service   │   Logic     │    Service               │ │
│   │             │             │  (Email/SMS)             │ │
│   └─────────────┴─────────────┴──────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       Data Layer                             │
│                  MongoDB Database                            │
│   Users | Appointments | Records | Analytics | Logs         │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
uniilorin-e-hospital-management-system/
├── frontend/               # React.js frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # State management
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
│
├── backend/               # Node.js backend application
│   ├── src/
│   │   ├── models/        # Database models
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── package.json
│
└── docs/                  # Documentation
    ├── API_DOCUMENTATION.md
    ├── USER_MANUALS.md
    └── DEPLOYMENT_GUIDE.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- Git
- Code editor (VS Code recommended)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/dammyart/uniilorin-e-hospital-management-system.git
cd uniilorin-e-hospital-management-system
```

#### 2. Set up Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your configuration
npm run dev
```

#### 3. Set up Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local file with your configuration
npm run dev
```

#### 4. Access the Application
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=E-Hospital Management System
```

---

## User Roles & Access Levels

### Patient Portal
- Register and manage profile
- Book appointments online
- View medical records and history
- Access prescriptions
- Receive notifications (SMS/Email)
- Download medical documents

### Doctor Portal
- View daily schedule
- Manage patient queue
- Access patient medical records
- Create consultation notes
- Generate prescriptions
- Order lab tests
- Review test results

### Administrator Portal
- Manage users (Patients, Doctors, Staff)
- View system analytics and reports
- Configure notification templates
- Monitor system logs
- Generate performance reports
- Manage departments and resources
- System settings configuration

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Book new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `GET /api/records/patient/:patientId` - Get patient records
- `POST /api/records` - Create medical record
- `PUT /api/records/:id` - Update medical record
- `GET /api/records/:id` - Get record by ID

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/appointments` - Appointment analytics
- `GET /api/analytics/patients` - Patient analytics
- `GET /api/analytics/revenue` - Revenue analytics

*Full API documentation available at `/docs/API_DOCUMENTATION.md`*

---

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Run unit tests
npm run test:integration   # Run integration tests
npm run test:coverage      # Generate coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

---

## Deployment

### Backend Deployment (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel
```

*Detailed deployment instructions available in `/docs/DEPLOYMENT_GUIDE.md`*

---

## Contributing

This is an academic project. For contributions or suggestions:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Project Timeline

- **Phase 1:** Research & Planning (2 weeks)
- **Phase 2:** System Design (2 weeks)
- **Phase 3:** Core Development (6 weeks)
- **Phase 4:** Testing & Optimization (2 weeks)
- **Phase 5:** Documentation & Deployment (2 weeks)

**Total Duration:** 14 weeks

---

## Performance Metrics

- Page Load Time: < 3 seconds
- Concurrent Users: 1000+
- System Availability: 99%
- API Response Time: < 100ms
- SMS Delivery Rate: > 95%
- Email Delivery Rate: > 98%

---

## Security Features

- JWT-based authentication
- Password encryption with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS attack protection
- HTTPS/SSL encryption
- Rate limiting on API endpoints
- CORS configuration
- Secure session management

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Supervisor:** Dr. Amos Bajeh - Department of Computer Science, University of Ilorin
- **Department:** Computer Science, Faculty of Science, University of Ilorin
- **Healthcare Workers** who inspired this digital transformation journey
- **Open Source Community** for the amazing tools and libraries

---

## Contact

**Obijole Oluwadamilola Oluwanifemi**  
Department of Computer Science  
University of Ilorin, Nigeria  
Email: Dammyartacademy@GMAIL.com  
GitHub: [@dammyart](https://github.com/dammyart)

---

## Project Status

Current Version: 0.1.0 (In Development)  
Expected Completion: February 2026

---

**Made with dedication for healthcare digital transformation**