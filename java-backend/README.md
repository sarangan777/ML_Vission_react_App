# MLVisioTrack Java Backend

A hybrid backend system using Java Servlets with Tomcat 10, Firebase Firestore for attendance data, and MySQL for other application features.

## 🏗️ Architecture Overview

### Data Storage Strategy
- **Firestore**: Real-time attendance data from ESP32-CAM devices
- **MySQL**: User profiles, courses, schedules, leave requests, and structured data

### Technology Stack
- **Java 11+**
- **Jakarta Servlet API 6.0** (Tomcat 10)
- **Firebase Admin SDK** for Firestore
- **MySQL** with HikariCP connection pooling
- **JWT** for authentication
- **Jackson** for JSON processing
- **BCrypt** for password hashing

## 📋 Prerequisites

- Java 11 or higher
- Apache Tomcat 10
- MySQL (via XAMPP or standalone)
- Maven 3.6+
- Firebase project with Firestore enabled

## 🚀 Setup Instructions

### 1. Database Setup (MySQL)

1. Start XAMPP and ensure MySQL is running
2. Create the database:
```sql
CREATE DATABASE mlvisiotrack;
```

3. Import the schema from the migration file:
```bash
mysql -u root -p mlvisiotrack < ../supabase/migrations/20250618084033_long_hill.sql
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Firestore Database
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download the JSON file
   - Place it in a secure location (e.g., `/path/to/firebase-service-account.json`)

### 3. Configuration

1. Update `src/main/resources/application.properties`:
```properties
# Database Configuration
db.host=localhost
db.port=3306
db.name=mlvisiotrack
db.username=root
db.password=your_mysql_password

# Firebase Configuration
firebase.project.id=your-firebase-project-id
firebase.credentials.path=/path/to/firebase-service-account.json

# JWT Configuration
jwt.secret=your-super-secret-jwt-key-here
jwt.expiration=604800000

# CORS Configuration (update for production)
cors.allowed.origins=http://localhost:3000,http://localhost:5173
```

### 4. Build and Deploy

1. Build the project:
```bash
mvn clean package
```

2. Deploy to Tomcat:
   - Copy `target/mlvisiotrack-backend.war` to Tomcat's `webapps` directory
   - Or use your IDE's Tomcat integration

3. Start Tomcat server

4. Verify deployment:
   - Visit: `http://localhost:8080/mlvisiotrack-backend/health`

## 📡 API Endpoints

### Base URL
```
http://localhost:8080/mlvisiotrack-backend/api
```

### Authentication Endpoints
- `POST /auth/login` - User/Admin login
- `POST /auth/register` - Create new user (Admin only)
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout

### Attendance Endpoints (Firestore)
- `POST /attendance/record` - Record attendance
- `POST /attendance/bulk-record` - Bulk record attendance (Admin only)
- `GET /attendance/student/{studentId}` - Get student attendance
- `GET /attendance/date/{date}` - Get attendance by date (Admin only)
- `GET /attendance/stats/{studentId}` - Get attendance statistics
- `PUT /attendance/{attendanceId}` - Update attendance status (Admin only)

### User Management Endpoints (MySQL)
- `GET /users` - Get all users with filters (Admin only)
- `DELETE /users/{userId}` - Delete user (Admin only)

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. **Login**: Send credentials to `/auth/login`
2. **Token**: Receive JWT token in response
3. **Authorization**: Include token in `Authorization: Bearer <token>` header
4. **Validation**: Token is validated on protected endpoints

### Default Admin Account
- **Admin ID**: `ADM001`
- **Password**: `admin123`
- **Email**: `admin@mlvisiotrack.com`

## 🔄 Data Flow

### Attendance Data (Firestore)
```
ESP32-CAM → Firebase Firestore → Java Backend → Frontend
```

### Other Data (MySQL)
```
Frontend → Java Backend → MySQL Database
```

## 🛡️ Security Features

- **JWT Authentication** with configurable expiration
- **Password Hashing** using BCrypt
- **Role-based Access Control** (Student/Admin)
- **CORS Protection** with configurable origins
- **SQL Injection Prevention** using PreparedStatements
- **Input Validation** and sanitization

## 📊 Database Schema

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

## 🔧 Development

### Running in Development Mode

1. Use Maven Tomcat plugin:
```bash
mvn tomcat7:run
```

2. Or deploy to local Tomcat instance and enable hot reload

### Testing

1. Unit tests:
```bash
mvn test
```

2. API testing with tools like Postman or curl

### Logging

The application uses SLF4J with Logback for logging. Logs are configured in `src/main/resources/logback.xml`.

## 🚀 Production Deployment

1. **Build for production**:
```bash
mvn clean package -Pprod
```

2. **Update configuration**:
   - Set production database credentials
   - Update CORS origins for production domains
   - Use strong JWT secret
   - Configure proper logging levels

3. **Deploy to production Tomcat**:
   - Copy WAR file to production server
   - Configure Tomcat with appropriate memory settings
   - Set up SSL/TLS certificates
   - Configure firewall rules

4. **Monitor and maintain**:
   - Set up log monitoring
   - Configure database backups
   - Monitor application performance

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check MySQL is running
   - Verify credentials in `application.properties`
   - Ensure database exists

2. **Firebase Initialization Failed**:
   - Verify service account JSON file path
   - Check Firebase project ID
   - Ensure Firestore is enabled

3. **JWT Token Issues**:
   - Check JWT secret configuration
   - Verify token expiration settings
   - Ensure proper Authorization header format

4. **CORS Issues**:
   - Update allowed origins in configuration
   - Check preflight request handling

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

## 🤝 Contributing

1. Follow Java coding conventions
2. Add proper error handling and logging
3. Include input validation for all endpoints
4. Write unit tests for new features
5. Update documentation for API changes

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Verify configuration settings
4. Create an issue in the repository