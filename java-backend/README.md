# MLVisioTrack Java Backend (MySQL Only)

A complete Java servlet-based backend system for attendance management using MySQL database only.

## 🏗️ Architecture Overview

### Data Storage Strategy
- **MySQL**: All data including attendance records, user profiles, courses, schedules, and leave requests

### Technology Stack
- **Java 11+**
- **Jakarta Servlet API 6.0** (Tomcat 10)
- **MySQL** with HikariCP connection pooling
- **JWT** for authentication
- **Jackson** for JSON processing
- **BCrypt** for password hashing

## 📋 Prerequisites

- Java 11 or higher
- Apache Tomcat 10
- MySQL (via XAMPP or standalone)
- Maven 3.6+

## 🚀 Setup Instructions

### 1. Database Setup (MySQL)

1. Start XAMPP and ensure MySQL is running
2. Create the database:
```sql
CREATE DATABASE mlvisiotrack;
```

3. Create the attendance table:
```sql
USE mlvisiotrack;

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_device_id (device_id),
  INDEX idx_timestamp (timestamp)
);
```

4. Import the existing schema from the migration file for other tables:
```bash
mysql -u root -p mlvisiotrack < ../supabase/migrations/20250618084033_long_hill.sql
```

### 2. Configuration

1. Update `src/main/resources/application.properties`:
```properties
# Database Configuration
db.host=localhost
db.port=3306
db.name=mlvisiotrack
db.username=root
db.password=your_mysql_password

# JWT Configuration
jwt.secret=your-super-secret-jwt-key-here
jwt.expiration=604800000

# CORS Configuration (update for production)
cors.allowed.origins=http://localhost:3000,http://localhost:5173
```

### 3. Build and Deploy

1. Build the project:
```bash
cd java-backend
mvn clean package
```

2. Deploy to Tomcat:
   - Copy `target/mlvisiotrack-backend.war` to Tomcat's `webapps` directory
   - Or use your IDE's Tomcat integration

3. Start Tomcat server

4. Verify deployment:
   - Visit: `http://localhost:8080/mlvisiotrack-backend/api/auth/login`

## 📡 API Endpoints

### Base URL
```
http://localhost:8080/mlvisiotrack-backend/api
```

### ESP32 Endpoints
- `POST /attendance/logAttendance` - Log attendance from ESP32 devices

### Frontend Endpoints
- `GET /attendance/getAttendance` - Get all attendance records
- `GET /attendance/student/{studentId}` - Get student attendance
- `GET /attendance/date/{date}` - Get attendance by date (Admin only)
- `GET /attendance/stats/{studentId}` - Get attendance statistics
- `DELETE /attendance/{attendanceId}` - Delete attendance record (Admin only)

### Authentication Endpoints
- `POST /auth/login` - User/Admin login
- `POST /auth/register` - Create new user (Admin only)
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

### User Management Endpoints
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

## 🔄 ESP32 Integration

### ESP32 Code Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverURL = "http://your-server:8080/mlvisiotrack-backend/api/attendance/logAttendance";

void logAttendance(String studentId, String deviceId) {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["student_id"] = studentId;
  doc["device_id"] = deviceId;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Attendance logged: " + response);
  } else {
    Serial.println("Error logging attendance");
  }
  
  http.end();
}
```

## 🔄 Data Flow

### Attendance Flow
```
ESP32-CAM → MySQL Database → Java Servlet → Frontend
```

### User Management Flow
```
Frontend → Java Servlet → MySQL Database
```

## 🛡️ Security Features

- **JWT Authentication** with configurable expiration
- **Password Hashing** using BCrypt
- **Role-based Access Control** (Student/Admin)
- **CORS Protection** with configurable origins
- **SQL Injection Prevention** using PreparedStatements
- **Input Validation** and sanitization

## 📊 Database Schema

### Attendance Table
```sql
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Other Tables
- `users` - Student and admin profiles
- `courses` - Course information
- `lecturers` - Lecturer details
- `rooms` - Room/venue information
- `schedules` - Class schedules
- `enrollments` - Student course enrollments
- `leave_requests` - Leave applications

## 🔧 Development

### Running in Development Mode

1. Use Maven Tomcat plugin:
```bash
mvn tomcat7:run
```

2. Or deploy to local Tomcat instance

### Testing

Test the ESP32 endpoint:
```bash
curl -X POST http://localhost:8080/mlvisiotrack-backend/api/attendance/logAttendance \
  -H "Content-Type: application/json" \
  -d '{"student_id": "STD001", "device_id": "ESP32_001"}'
```

## 🚀 Production Deployment

1. **Build for production**:
```bash
mvn clean package
```

2. **Update configuration**:
   - Set production database credentials
   - Update CORS origins for production domains
   - Use strong JWT secret

3. **Deploy to production Tomcat**:
   - Copy WAR file to production server
   - Configure SSL/TLS certificates
   - Set up proper firewall rules

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

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check MySQL is running
   - Verify credentials in `application.properties`
   - Ensure database and tables exist

2. **JWT Token Issues**:
   - Check JWT secret configuration
   - Verify token expiration settings
   - Ensure proper Authorization header format

3. **CORS Issues**:
   - Update allowed origins in configuration
   - Check preflight request handling

4. **ESP32 Connection Issues**:
   - Verify server URL and port
   - Check network connectivity
   - Ensure JSON format is correct

## 🤝 Contributing

1. Follow Java coding conventions
2. Add proper error handling and logging
3. Include input validation for all endpoints
4. Write unit tests for new features
5. Update documentation for API changes