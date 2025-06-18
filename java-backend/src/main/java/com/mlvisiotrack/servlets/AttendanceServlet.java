package com.mlvisiotrack.servlets;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mlvisiotrack.dao.AttendanceDAO;
import com.mlvisiotrack.models.AttendanceRecord;
import com.mlvisiotrack.utils.JsonResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AttendanceServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(AttendanceServlet.class);
    private ObjectMapper objectMapper;
    private AttendanceDAO attendanceDAO;
    
    @Override
    public void init() throws ServletException {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        attendanceDAO = new AttendanceDAO();
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            switch (pathInfo) {
                case "/record":
                    handleRecordAttendance(request, response);
                    break;
                case "/bulk-record":
                    handleBulkRecordAttendance(request, response);
                    break;
                default:
                    JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AttendanceServlet POST", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            if (pathInfo.startsWith("/student/")) {
                handleGetStudentAttendance(request, response);
            } else if (pathInfo.startsWith("/date/")) {
                handleGetAttendanceByDate(request, response);
            } else if (pathInfo.startsWith("/stats/")) {
                handleGetAttendanceStats(request, response);
            } else {
                JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AttendanceServlet GET", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            if (pathInfo.startsWith("/")) {
                handleUpdateAttendanceStatus(request, response);
            } else {
                JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AttendanceServlet PUT", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    private void handleRecordAttendance(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        // Validate required fields
        String studentId = (String) requestData.get("studentId");
        String dateStr = (String) requestData.get("date");
        String statusStr = (String) requestData.get("status");
        
        if (studentId == null || dateStr == null || statusStr == null) {
            JsonResponse.sendError(response, 400, "Student ID, date, and status are required");
            return;
        }
        
        // Create attendance record
        AttendanceRecord record = new AttendanceRecord();
        record.setStudentId(studentId);
        record.setStudentName((String) requestData.get("studentName"));
        record.setRegistrationNumber((String) requestData.get("registrationNumber"));
        record.setCourseId((String) requestData.get("courseId"));
        record.setCourseName((String) requestData.get("courseName"));
        record.setScheduleId((String) requestData.get("scheduleId"));
        record.setDate(LocalDate.parse(dateStr));
        
        String arrivalTimeStr = (String) requestData.get("arrivalTime");
        if (arrivalTimeStr != null) {
            record.setArrivalTime(LocalTime.parse(arrivalTimeStr));
        }
        
        record.setStatus(AttendanceRecord.AttendanceStatus.fromString(statusStr));
        record.setMethod((String) requestData.getOrDefault("method", "manual"));
        record.setRemarks((String) requestData.get("remarks"));
        record.setRecordedBy((String) request.getAttribute("userId"));
        
        AttendanceRecord createdRecord = attendanceDAO.create(record);
        
        JsonResponse.sendSuccess(response, createdRecord, "Attendance recorded successfully", 201);
    }
    
    private void handleBulkRecordAttendance(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        // Check if user is admin
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        List<Map<String, Object>> attendanceRecords = (List<Map<String, Object>>) requestData.get("attendanceRecords");
        
        if (attendanceRecords == null || attendanceRecords.isEmpty()) {
            JsonResponse.sendError(response, 400, "Attendance records are required");
            return;
        }
        
        List<AttendanceRecord> records = new ArrayList<>();
        String recordedBy = (String) request.getAttribute("userId");
        
        for (Map<String, Object> recordData : attendanceRecords) {
            AttendanceRecord record = new AttendanceRecord();
            record.setStudentId((String) recordData.get("studentId"));
            record.setStudentName((String) recordData.get("studentName"));
            record.setRegistrationNumber((String) recordData.get("registrationNumber"));
            record.setCourseId((String) recordData.get("courseId"));
            record.setCourseName((String) recordData.get("courseName"));
            record.setScheduleId((String) recordData.get("scheduleId"));
            record.setDate(LocalDate.parse((String) recordData.get("date")));
            
            String arrivalTimeStr = (String) recordData.get("arrivalTime");
            if (arrivalTimeStr != null) {
                record.setArrivalTime(LocalTime.parse(arrivalTimeStr));
            }
            
            record.setStatus(AttendanceRecord.AttendanceStatus.fromString((String) recordData.get("status")));
            record.setMethod("bulk_manual");
            record.setRemarks((String) recordData.get("remarks"));
            record.setRecordedBy(recordedBy);
            
            records.add(record);
        }
        
        List<AttendanceRecord> createdRecords = attendanceDAO.bulkCreate(records);
        
        JsonResponse.sendSuccess(response, createdRecords, 
            createdRecords.size() + " attendance records created successfully", 201);
    }
    
    private void handleGetStudentAttendance(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        String pathInfo = request.getPathInfo();
        String studentId = pathInfo.substring("/student/".length());
        
        // Students can only view their own attendance, admins can view any
        String userId = (String) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");
        
        if (!"admin".equals(userRole) && !userId.equals(studentId)) {
            JsonResponse.sendError(response, 403, "Access denied. You can only view your own attendance.");
            return;
        }
        
        String startDateStr = request.getParameter("startDate");
        String endDateStr = request.getParameter("endDate");
        
        LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : null;
        LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : null;
        
        List<AttendanceRecord> records = attendanceDAO.findByStudent(studentId, startDate, endDate);
        
        JsonResponse.sendSuccess(response, records);
    }
    
    private void handleGetAttendanceByDate(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        // Only admins can view attendance by date
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        String pathInfo = request.getPathInfo();
        String dateStr = pathInfo.substring("/date/".length());
        LocalDate date = LocalDate.parse(dateStr);
        
        String department = request.getParameter("department");
        String courseId = request.getParameter("course");
        
        List<AttendanceRecord> records = attendanceDAO.findByDate(date, department, courseId);
        
        JsonResponse.sendSuccess(response, records);
    }
    
    private void handleGetAttendanceStats(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        String pathInfo = request.getPathInfo();
        String studentId = pathInfo.substring("/stats/".length());
        
        // Students can only view their own stats, admins can view any
        String userId = (String) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");
        
        if (!"admin".equals(userRole) && !userId.equals(studentId)) {
            JsonResponse.sendError(response, 403, "Access denied. You can only view your own statistics.");
            return;
        }
        
        String startDateStr = request.getParameter("startDate");
        String endDateStr = request.getParameter("endDate");
        
        LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : null;
        LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : null;
        
        Map<String, Object> stats = attendanceDAO.getAttendanceStats(studentId, startDate, endDate);
        
        JsonResponse.sendSuccess(response, stats);
    }
    
    private void handleUpdateAttendanceStatus(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        // Only admins can update attendance
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        String pathInfo = request.getPathInfo();
        String attendanceId = pathInfo.substring(1); // Remove leading slash
        
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        String statusStr = (String) requestData.get("status");
        String remarks = (String) requestData.get("remarks");
        
        if (statusStr == null) {
            JsonResponse.sendError(response, 400, "Status is required");
            return;
        }
        
        AttendanceRecord.AttendanceStatus status = AttendanceRecord.AttendanceStatus.fromString(statusStr);
        
        boolean success = attendanceDAO.updateStatus(attendanceId, status, remarks);
        
        if (success) {
            JsonResponse.sendSuccess(response, null, "Attendance status updated successfully");
        } else {
            JsonResponse.sendError(response, 500, "Failed to update attendance status");
        }
    }
}