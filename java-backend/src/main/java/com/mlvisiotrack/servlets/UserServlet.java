package com.mlvisiotrack.servlets;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mlvisiotrack.dao.UserDAO;
import com.mlvisiotrack.models.User;
import com.mlvisiotrack.utils.JsonResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;

public class UserServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(UserServlet.class);
    private ObjectMapper objectMapper;
    private UserDAO userDAO;
    
    @Override
    public void init() throws ServletException {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        userDAO = new UserDAO();
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Only admins can access user management
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        try {
            String role = request.getParameter("role");
            String department = request.getParameter("department");
            String year = request.getParameter("year");
            String search = request.getParameter("search");
            
            List<User> users = userDAO.findAll(role, department, year, search);
            
            JsonResponse.sendSuccess(response, users);
            
        } catch (Exception e) {
            logger.error("Error in UserServlet GET", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Only admins can delete users
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        try {
            String pathInfo = request.getPathInfo();
            if (pathInfo == null || pathInfo.length() <= 1) {
                JsonResponse.sendError(response, 400, "User ID is required");
                return;
            }
            
            String userId = pathInfo.substring(1); // Remove leading slash
            
            boolean success = userDAO.delete(userId);
            
            if (success) {
                JsonResponse.sendSuccess(response, null, "User deleted successfully");
            } else {
                JsonResponse.sendError(response, 404, "User not found");
            }
            
        } catch (Exception e) {
            logger.error("Error in UserServlet DELETE", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
}