# MLVisioTrack Backend

A hybrid backend system that uses Firebase Firestore for attendance data and MySQL for other application features.

## Architecture Overview

### Data Storage Strategy
- **Firestore**: Real-time attendance data from ESP32-CAM devices
- **MySQL**: User profiles, courses, schedules, leave requests, and other structured data

### Key Features
- JWT-based authentication
- Role-based access control (Student/Admin)
- Real-time attendance tracking
- Comprehensive user management
- Leave request system
- Attendance review system

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (via XAMPP or standalone)
- Firebase project with Firestore enabled

### 1. Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
   - MySQL database credentials
   - Firebase service account details
   - JWT secret key

### 2. Database Setup

1. Start XAMPP and ensure MySQL is running
2. Create the database:
```sql
CREATE DATABASE mlvisiotrack;
```

3. Import the schema:
```bash
mysql -u root -p mlvisiotrack < database/schema.sql
```

### 3. Firebase Setup

1. Go to Firebase Console
2. Create a new project or use existing
3. Enable Firestore Database
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Add the credentials to your `.env` file

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/register` - Create new user (Admin only)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Attendance (Firestore)
- `POST /api/attendance/record` - Record attendance
- `POST /api/attendance/bulk-record` - Bulk record attendance
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/date/:date` - Get attendance by date
- `GET /api/attendance/stats/:studentId` - Get attendance statistics
- `PUT /api/attendance/:attendanceId` - Update attendance status

## Data Flow

### Attendance Data (Firestore)
```
ESP32-CAM → Firebase Firestore → Backend API → Frontend
```

### Other Data (MySQL)
```
Frontend → Backend API → MySQL Database
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention

## Database Schema

### MySQL Tables
- `users` - Student and admin profiles
- `courses` - Course information
- `lecturers` - Lecturer details
- `rooms` - Room/venue information
- `schedules` - Class schedules
- `enrollments` - Student course enrollments
- `leave_requests` - Leave applications
- `attendance_reviews` - Attendance dispute requests
- `system_settings` - Application settings

### Firestore Collections
- `attendance` - Real-time attendance records

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Testing

Run tests:
```bash
npm test
```

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Update CORS origins for production domains
3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name mlvisiotrack-backend
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation for new endpoints
5. Test thoroughly before submitting

## Support

For issues and questions, please check the documentation or create an issue in the repository.