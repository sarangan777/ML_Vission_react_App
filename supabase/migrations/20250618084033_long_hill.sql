-- MLVisioTrack Database Schema
-- This handles all non-attendance data (users, courses, schedules, etc.)

CREATE DATABASE IF NOT EXISTS mlvisiotrack;
USE mlvisiotrack;

-- Users table (students and admins)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE,
    admin_id VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    department VARCHAR(50),
    year ENUM('1st Year', '2nd Year', '3rd Year'),
    type ENUM('Full Time', 'Part Time'),
    birth_date DATE,
    profile_picture VARCHAR(255),
    admin_level ENUM('super', 'regular') DEFAULT 'regular',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_registration (registration_number),
    INDEX idx_admin_id (admin_id),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department)
);

-- Courses table
CREATE TABLE courses (
    id VARCHAR(36) PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year ENUM('1st Year', '2nd Year', '3rd Year') NOT NULL,
    type ENUM('Full Time', 'Part Time') NOT NULL,
    credits INT DEFAULT 3,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_course_code (course_code),
    INDEX idx_department (department),
    INDEX idx_year_type (year, type)
);

-- Lecturers table
CREATE TABLE lecturers (
    id VARCHAR(36) PRIMARY KEY,
    lecturer_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    specialization VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lecturer_id (lecturer_id),
    INDEX idx_department (department)
);

-- Rooms table
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_name VARCHAR(50),
    building VARCHAR(50),
    capacity INT,
    room_type ENUM('Lecture Hall', 'Laboratory', 'Tutorial Room', 'Computer Lab') DEFAULT 'Lecture Hall',
    equipment TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_room_number (room_number),
    INDEX idx_building (building)
);

-- Schedules table
CREATE TABLE schedules (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    lecturer_id VARCHAR(36) NOT NULL,
    room_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    
    INDEX idx_course (course_id),
    INDEX idx_lecturer (lecturer_id),
    INDEX idx_room (room_id),
    INDEX idx_day_time (day_of_week, start_time),
    INDEX idx_date_range (start_date, end_date)
);

-- Student enrollments
CREATE TABLE enrollments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
    grade VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student (student_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    leave_type ENUM('sick', 'vacation', 'personal', 'emergency', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_remarks TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_student (student_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_reviewed_by (reviewed_by)
);

-- Attendance review requests table
CREATE TABLE attendance_reviews (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    attendance_date DATE NOT NULL,
    current_status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
    requested_status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
    reason TEXT NOT NULL,
    comments TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_remarks TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_student (student_id),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_reviewed_by (reviewed_by)
);

-- System settings table
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key)
);

-- Insert default admin user
INSERT INTO users (
    id, 
    admin_id, 
    name, 
    email, 
    password_hash, 
    role, 
    department, 
    admin_level
) VALUES (
    'ADMIN001',
    'ADM001',
    'System Administrator',
    'admin@mlvisiotrack.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'admin',
    'Administration',
    'super'
);

-- Insert sample departments and courses
INSERT INTO courses (id, course_code, course_name, department, year, type) VALUES
('COURSE001', 'HNDIT101', 'Programming Fundamentals', 'HNDIT', '1st Year', 'Full Time'),
('COURSE002', 'HNDIT102', 'Database Systems', 'HNDIT', '1st Year', 'Full Time'),
('COURSE003', 'HNDA101', 'Accounting Principles', 'HNDA', '1st Year', 'Full Time'),
('COURSE004', 'HNDE101', 'Engineering Mathematics', 'HNDE', '1st Year', 'Full Time');

-- Insert sample lecturers
INSERT INTO lecturers (id, lecturer_id, name, email, department) VALUES
('LECT001', 'LEC001', 'Dr. John Smith', 'john.smith@college.edu', 'HNDIT'),
('LECT002', 'LEC002', 'Prof. Jane Doe', 'jane.doe@college.edu', 'HNDA'),
('LECT003', 'LEC003', 'Mr. Mike Johnson', 'mike.johnson@college.edu', 'HNDE');

-- Insert sample rooms
INSERT INTO rooms (id, room_number, room_name, building, capacity, room_type) VALUES
('ROOM001', 'LAB01', 'Computer Laboratory 1', 'Main Building', 30, 'Computer Lab'),
('ROOM002', 'LAB02', 'Computer Laboratory 2', 'Main Building', 30, 'Computer Lab'),
('ROOM003', 'LH01', 'Lecture Hall 1', 'Academic Block', 100, 'Lecture Hall');

-- Insert default system settings
INSERT INTO system_settings (id, setting_key, setting_value, description) VALUES
('SET001', 'attendance_threshold', '80', 'Minimum attendance percentage required for exam eligibility'),
('SET002', 'late_arrival_minutes', '15', 'Minutes after start time considered as late arrival'),
('SET003', 'academic_year_start', '2024-01-01', 'Start date of current academic year'),
('SET004', 'academic_year_end', '2024-12-31', 'End date of current academic year');