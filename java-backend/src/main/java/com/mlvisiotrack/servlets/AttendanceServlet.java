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
            if ("/logAttendance".equals(pathInfo)) {
                handleLogAttendance(request, response);
            } else {
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
            if ("/getAttendance".equals(pathInfo)) {
                handleGetAttendance(request, response);
            } else if (pathInfo != null && pathInfo.startsWith("/student/")) {
                handleGetStudentAttendance(request, response);
            } else if (pathInfo != null && pathInfo.startsWith("/date/")) {
                handleGetAttendanceByDate(request, response);
            } else if (pathInfo != null && pathInfo.startsWith("/stats/")) {
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
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            if (pathInfo != null && pathInfo.startsWith("/")) {
                handleDeleteAttendance(request, response);
            } else {
                JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AttendanceServlet DELETE", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    // ESP32 endpoint for logging attendance
    private void handleLogAttendance(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        String studentId = (String) requestData.get("student_id");
        String deviceId = (String) requestData.get("device_id");
        
        if (studentId == null || deviceId == null) {
            JsonResponse.sendError(response, 400, "student_id and device_id are required");
            return;
        }
        
        AttendanceRecord record = attendanceDAO.logAttendance(studentId, deviceId);
        
        JsonResponse.sendSuccess(response, record, "Attendance logged successfully", 201);
    }
    
    // Frontend endpoint for getting all attendance
    private void handleGetAttendance(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        String startDateStr = request.getParameter("startDate");
        String endDateStr = request.getParameter("endDate");
        String department = request.getParameter("department");
        
        LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr) : null;
        LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr) : null;
        
        List<AttendanceRecord> records = attendanceDAO.getAllAttendance(startDate, endDate, department);
        
        JsonResponse.sendSuccess(response, records);
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
        
        List<AttendanceRecord> records = attendanceDAO.getAttendanceByStudent(studentId, startDate, endDate);
        
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
        
        List<AttendanceRecord> records = attendanceDAO.getAttendanceByDate(date, department);
        
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
    
    private void handleDeleteAttendance(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        // Only admins can delete attendance
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        String pathInfo = request.getPathInfo();
        String attendanceIdStr = pathInfo.substring(1); // Remove leading slash
        
        try {
            Long attendanceId = Long.parseLong(attendanceIdStr);
            boolean success = attendanceDAO.deleteAttendance(attendanceId);
            
            if (success) {
                JsonResponse.sendSuccess(response, null, "Attendance record deleted successfully");
            } else {
                JsonResponse.sendError(response, 404, "Attendance record not found");
            }
        } catch (NumberFormatException e) {
            JsonResponse.sendError(response, 400, "Invalid attendance ID");
        }
    }
}