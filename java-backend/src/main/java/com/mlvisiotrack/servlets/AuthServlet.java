package com.mlvisiotrack.servlets;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
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
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

public class AuthServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(AuthServlet.class);
    private ObjectMapper objectMapper;
    private UserDAO userDAO;
    private Properties appProperties;
    
    @Override
    public void init() throws ServletException {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        userDAO = new UserDAO();
        appProperties = (Properties) getServletContext().getAttribute("appProperties");
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            switch (pathInfo) {
                case "/login":
                    handleLogin(request, response);
                    break;
                case "/register":
                    handleRegister(request, response);
                    break;
                case "/logout":
                    handleLogout(request, response);
                    break;
                default:
                    JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AuthServlet", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            if ("/profile".equals(pathInfo)) {
                handleGetProfile(request, response);
            } else {
                JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AuthServlet", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            switch (pathInfo) {
                case "/profile":
                    handleUpdateProfile(request, response);
                    break;
                case "/change-password":
                    handleChangePassword(request, response);
                    break;
                default:
                    JsonResponse.sendError(response, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            logger.error("Error in AuthServlet", e);
            JsonResponse.sendError(response, 500, "Internal server error");
        }
    }
    
    private void handleLogin(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        String identifier = (String) requestData.get("identifier");
        String password = (String) requestData.get("password");
        Boolean isAdmin = (Boolean) requestData.getOrDefault("isAdmin", false);
        
        if (identifier == null || password == null) {
            JsonResponse.sendError(response, 400, "Identifier and password are required");
            return;
        }
        
        // Find user by credentials
        User user = userDAO.findByCredentials(identifier, isAdmin);
        if (user == null) {
            JsonResponse.sendError(response, 401, "Invalid credentials");
            return;
        }
        
        // Verify password
        if (!userDAO.verifyPassword(password, user.getPasswordHash())) {
            JsonResponse.sendError(response, 401, "Invalid credentials");
            return;
        }
        
        // Generate JWT token
        String jwtSecret = appProperties.getProperty("jwt.secret");
        long jwtExpiration = Long.parseLong(appProperties.getProperty("jwt.expiration", "604800000"));
        
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        String token = JWT.create()
                .withSubject(user.getId())
                .withClaim("role", user.getRole().getValue())
                .withClaim("email", user.getEmail())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + jwtExpiration))
                .sign(algorithm);
        
        // Prepare response
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", user);
        responseData.put("token", token);
        
        JsonResponse.sendSuccess(response, responseData, "Login successful");
    }
    
    private void handleRegister(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        // Check if user is admin (this would be set by AuthFilter)
        String userRole = (String) request.getAttribute("userRole");
        if (!"admin".equals(userRole)) {
            JsonResponse.sendError(response, 403, "Access denied. Admin privileges required.");
            return;
        }
        
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        // Validate required fields
        String name = (String) requestData.get("name");
        String email = (String) requestData.get("email");
        String password = (String) requestData.get("password");
        String role = (String) requestData.get("role");
        String department = (String) requestData.get("department");
        
        if (name == null || email == null || password == null || role == null || department == null) {
            JsonResponse.sendError(response, 400, "Required fields are missing");
            return;
        }
        
        // Create user object
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setRole(User.UserRole.fromString(role));
        user.setDepartment(department);
        user.setRegistrationNumber((String) requestData.get("registrationNumber"));
        user.setAdminId((String) requestData.get("adminId"));
        user.setYear((String) requestData.get("year"));
        user.setType((String) requestData.get("type"));
        
        String adminLevel = (String) requestData.get("adminLevel");
        if (adminLevel != null) {
            user.setAdminLevel(User.AdminLevel.fromString(adminLevel));
        }
        
        User createdUser = userDAO.create(user, password);
        
        JsonResponse.sendSuccess(response, createdUser, "User created successfully", 201);
    }
    
    private void handleGetProfile(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        String userId = (String) request.getAttribute("userId");
        User user = userDAO.findById(userId);
        
        if (user == null) {
            JsonResponse.sendError(response, 404, "User not found");
            return;
        }
        
        JsonResponse.sendSuccess(response, user);
    }
    
    private void handleUpdateProfile(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        String userId = (String) request.getAttribute("userId");
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        User updateUser = new User();
        updateUser.setName((String) requestData.get("name"));
        updateUser.setEmail((String) requestData.get("email"));
        updateUser.setDepartment((String) requestData.get("department"));
        updateUser.setYear((String) requestData.get("year"));
        updateUser.setType((String) requestData.get("type"));
        updateUser.setProfilePicture((String) requestData.get("profilePicture"));
        
        User updatedUser = userDAO.update(userId, updateUser);
        
        JsonResponse.sendSuccess(response, updatedUser, "Profile updated successfully");
    }
    
    private void handleChangePassword(HttpServletRequest request, HttpServletResponse response) 
            throws Exception {
        
        String userId = (String) request.getAttribute("userId");
        Map<String, Object> requestData = objectMapper.readValue(request.getReader(), Map.class);
        
        String currentPassword = (String) requestData.get("currentPassword");
        String newPassword = (String) requestData.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            JsonResponse.sendError(response, 400, "Current password and new password are required");
            return;
        }
        
        // Get current user
        User user = userDAO.findById(userId);
        if (user == null) {
            JsonResponse.sendError(response, 404, "User not found");
            return;
        }
        
        // Verify current password
        if (!userDAO.verifyPassword(currentPassword, user.getPasswordHash())) {
            JsonResponse.sendError(response, 400, "Current password is incorrect");
            return;
        }
        
        // Update password
        boolean success = userDAO.updatePassword(userId, newPassword);
        
        if (success) {
            JsonResponse.sendSuccess(response, null, "Password changed successfully");
        } else {
            JsonResponse.sendError(response, 500, "Failed to update password");
        }
    }
    
    private void handleLogout(HttpServletRequest request, HttpServletResponse response) 
            throws IOException {
        JsonResponse.sendSuccess(response, null, "Logged out successfully");
    }
}