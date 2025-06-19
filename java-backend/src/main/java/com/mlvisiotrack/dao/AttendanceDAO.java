package com.mlvisiotrack.dao;

import com.mlvisiotrack.config.DatabaseConfig;
import com.mlvisiotrack.models.AttendanceRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AttendanceDAO {
    private static final Logger logger = LoggerFactory.getLogger(AttendanceDAO.class);
    
    public AttendanceRecord logAttendance(String studentId, String deviceId) throws SQLException {
        String query = """
            INSERT INTO attendance (student_id, device_id, timestamp) 
            VALUES (?, ?, ?)
        """;
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) {
            
            LocalDateTime now = LocalDateTime.now();
            stmt.setString(1, studentId);
            stmt.setString(2, deviceId);
            stmt.setTimestamp(3, Timestamp.valueOf(now));
            
            int rowsAffected = stmt.executeUpdate();
            
            if (rowsAffected > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        AttendanceRecord record = new AttendanceRecord(studentId, deviceId);
                        record.setId(generatedKeys.getLong(1));
                        record.setTimestamp(now);
                        
                        logger.info("Attendance logged for student: {} from device: {}", studentId, deviceId);
                        return record;
                    }
                }
            }
        }
        
        throw new SQLException("Failed to log attendance");
    }
    
    public List<AttendanceRecord> getAttendanceByStudent(String studentId, LocalDate startDate, LocalDate endDate) throws SQLException {
        StringBuilder queryBuilder = new StringBuilder("""
            SELECT a.*, u.name as student_name, u.registration_number, u.department 
            FROM attendance a 
            LEFT JOIN users u ON a.student_id = u.id 
            WHERE a.student_id = ?
        """);
        
        List<Object> parameters = new ArrayList<>();
        parameters.add(studentId);
        
        if (startDate != null) {
            queryBuilder.append(" AND DATE(a.timestamp) >= ?");
            parameters.add(Date.valueOf(startDate));
        }
        
        if (endDate != null) {
            queryBuilder.append(" AND DATE(a.timestamp) <= ?");
            parameters.add(Date.valueOf(endDate));
        }
        
        queryBuilder.append(" ORDER BY a.timestamp DESC");
        
        List<AttendanceRecord> records = new ArrayList<>();
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(queryBuilder.toString())) {
            
            for (int i = 0; i < parameters.size(); i++) {
                stmt.setObject(i + 1, parameters.get(i));
            }
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    records.add(mapResultSetToRecord(rs));
                }
            }
        }
        
        return records;
    }
    
    public List<AttendanceRecord> getAttendanceByDate(LocalDate date, String department) throws SQLException {
        StringBuilder queryBuilder = new StringBuilder("""
            SELECT a.*, u.name as student_name, u.registration_number, u.department 
            FROM attendance a 
            LEFT JOIN users u ON a.student_id = u.id 
            WHERE DATE(a.timestamp) = ?
        """);
        
        List<Object> parameters = new ArrayList<>();
        parameters.add(Date.valueOf(date));
        
        if (department != null && !department.isEmpty()) {
            queryBuilder.append(" AND u.department = ?");
            parameters.add(department);
        }
        
        queryBuilder.append(" ORDER BY a.timestamp DESC");
        
        List<AttendanceRecord> records = new ArrayList<>();
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(queryBuilder.toString())) {
            
            for (int i = 0; i < parameters.size(); i++) {
                stmt.setObject(i + 1, parameters.get(i));
            }
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    records.add(mapResultSetToRecord(rs));
                }
            }
        }
        
        return records;
    }
    
    public List<AttendanceRecord> getAllAttendance(LocalDate startDate, LocalDate endDate, String department) throws SQLException {
        StringBuilder queryBuilder = new StringBuilder("""
            SELECT a.*, u.name as student_name, u.registration_number, u.department 
            FROM attendance a 
            LEFT JOIN users u ON a.student_id = u.id 
            WHERE 1=1
        """);
        
        List<Object> parameters = new ArrayList<>();
        
        if (startDate != null) {
            queryBuilder.append(" AND DATE(a.timestamp) >= ?");
            parameters.add(Date.valueOf(startDate));
        }
        
        if (endDate != null) {
            queryBuilder.append(" AND DATE(a.timestamp) <= ?");
            parameters.add(Date.valueOf(endDate));
        }
        
        if (department != null && !department.isEmpty()) {
            queryBuilder.append(" AND u.department = ?");
            parameters.add(department);
        }
        
        queryBuilder.append(" ORDER BY a.timestamp DESC");
        
        List<AttendanceRecord> records = new ArrayList<>();
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(queryBuilder.toString())) {
            
            for (int i = 0; i < parameters.size(); i++) {
                stmt.setObject(i + 1, parameters.get(i));
            }
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    records.add(mapResultSetToRecord(rs));
                }
            }
        }
        
        return records;
    }
    
    public Map<String, Object> getAttendanceStats(String studentId, LocalDate startDate, LocalDate endDate) throws SQLException {
        List<AttendanceRecord> records = getAttendanceByStudent(studentId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        int totalDays = records.size();
        int presentDays = totalDays; // All records in attendance table are "present"
        
        stats.put("totalDays", totalDays);
        stats.put("presentDays", presentDays);
        stats.put("absentDays", 0); // We don't track absent days in this simple model
        
        double attendancePercentage = totalDays > 0 ? 100.0 : 0.0; // 100% for logged attendance
        stats.put("attendancePercentage", attendancePercentage);
        
        return stats;
    }
    
    public boolean deleteAttendance(Long id) throws SQLException {
        String query = "DELETE FROM attendance WHERE id = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
    
    private AttendanceRecord mapResultSetToRecord(ResultSet rs) throws SQLException {
        AttendanceRecord record = new AttendanceRecord();
        record.setId(rs.getLong("id"));
        record.setStudentId(rs.getString("student_id"));
        record.setDeviceId(rs.getString("device_id"));
        
        Timestamp timestamp = rs.getTimestamp("timestamp");
        if (timestamp != null) {
            record.setTimestamp(timestamp.toLocalDateTime());
        }
        
        record.setStudentName(rs.getString("student_name"));
        record.setRegistrationNumber(rs.getString("registration_number"));
        record.setDepartment(rs.getString("department"));
        record.setStatus("Present"); // Default status for logged attendance
        
        return record;
    }
}