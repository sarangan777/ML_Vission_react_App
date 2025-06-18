package com.mlvisiotrack.dao;

import com.mlvisiotrack.config.DatabaseConfig;
import com.mlvisiotrack.models.User;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserDAO {
    private static final Logger logger = LoggerFactory.getLogger(UserDAO.class);
    
    public User findByCredentials(String identifier, boolean isAdmin) throws SQLException {
        String query;
        if (isAdmin) {
            query = "SELECT * FROM users WHERE admin_id = ? AND role = 'admin' AND is_active = TRUE";
        } else {
            query = "SELECT * FROM users WHERE registration_number = ? AND role = 'student' AND is_active = TRUE";
        }
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, identifier);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        }
        
        return null;
    }
    
    public User findById(String id) throws SQLException {
        String query = "SELECT * FROM users WHERE id = ? AND is_active = TRUE";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, id);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        }
        
        return null;
    }
    
    public User create(User user, String password) throws SQLException {
        String id = UUID.randomUUID().toString();
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());
        
        String query = """
            INSERT INTO users (
                id, registration_number, admin_id, name, email, password_hash, 
                role, department, year, type, birth_date, admin_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, id);
            stmt.setString(2, user.getRegistrationNumber());
            stmt.setString(3, user.getAdminId());
            stmt.setString(4, user.getName());
            stmt.setString(5, user.getEmail());
            stmt.setString(6, hashedPassword);
            stmt.setString(7, user.getRole().getValue());
            stmt.setString(8, user.getDepartment());
            stmt.setString(9, user.getYear());
            stmt.setString(10, user.getType());
            stmt.setDate(11, user.getBirthDate() != null ? Date.valueOf(user.getBirthDate()) : null);
            stmt.setString(12, user.getAdminLevel() != null ? user.getAdminLevel().getValue() : "regular");
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                return findById(id);
            }
        }
        
        return null;
    }
    
    public User update(String id, User user) throws SQLException {
        StringBuilder queryBuilder = new StringBuilder("UPDATE users SET ");
        List<Object> parameters = new ArrayList<>();
        
        if (user.getName() != null) {
            queryBuilder.append("name = ?, ");
            parameters.add(user.getName());
        }
        
        if (user.getEmail() != null) {
            queryBuilder.append("email = ?, ");
            parameters.add(user.getEmail());
        }
        
        if (user.getDepartment() != null) {
            queryBuilder.append("department = ?, ");
            parameters.add(user.getDepartment());
        }
        
        if (user.getYear() != null) {
            queryBuilder.append("year = ?, ");
            parameters.add(user.getYear());
        }
        
        if (user.getType() != null) {
            queryBuilder.append("type = ?, ");
            parameters.add(user.getType());
        }
        
        if (user.getBirthDate() != null) {
            queryBuilder.append("birth_date = ?, ");
            parameters.add(Date.valueOf(user.getBirthDate()));
        }
        
        if (user.getProfilePicture() != null) {
            queryBuilder.append("profile_picture = ?, ");
            parameters.add(user.getProfilePicture());
        }
        
        if (parameters.isEmpty()) {
            throw new SQLException("No fields to update");
        }
        
        queryBuilder.append("updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        parameters.add(id);
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(queryBuilder.toString())) {
            
            for (int i = 0; i < parameters.size(); i++) {
                stmt.setObject(i + 1, parameters.get(i));
            }
            
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                return findById(id);
            }
        }
        
        return null;
    }
    
    public boolean updatePassword(String id, String newPassword) throws SQLException {
        String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());
        String query = "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, hashedPassword);
            stmt.setString(2, id);
            
            return stmt.executeUpdate() > 0;
        }
    }
    
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        return BCrypt.checkpw(plainPassword, hashedPassword);
    }
    
    public List<User> findAll(String role, String department, String year, String search) throws SQLException {
        StringBuilder queryBuilder = new StringBuilder(
            "SELECT * FROM users WHERE is_active = TRUE"
        );
        List<Object> parameters = new ArrayList<>();
        
        if (role != null && !role.isEmpty()) {
            queryBuilder.append(" AND role = ?");
            parameters.add(role);
        }
        
        if (department != null && !department.isEmpty()) {
            queryBuilder.append(" AND department = ?");
            parameters.add(department);
        }
        
        if (year != null && !year.isEmpty()) {
            queryBuilder.append(" AND year = ?");
            parameters.add(year);
        }
        
        if (search != null && !search.isEmpty()) {
            queryBuilder.append(" AND (name LIKE ? OR email LIKE ? OR registration_number LIKE ?)");
            String searchPattern = "%" + search + "%";
            parameters.add(searchPattern);
            parameters.add(searchPattern);
            parameters.add(searchPattern);
        }
        
        queryBuilder.append(" ORDER BY created_at DESC");
        
        List<User> users = new ArrayList<>();
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(queryBuilder.toString())) {
            
            for (int i = 0; i < parameters.size(); i++) {
                stmt.setObject(i + 1, parameters.get(i));
            }
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    users.add(mapResultSetToUser(rs));
                }
            }
        }
        
        return users;
    }
    
    public boolean delete(String id) throws SQLException {
        String query = "UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
    
    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getString("id"));
        user.setRegistrationNumber(rs.getString("registration_number"));
        user.setAdminId(rs.getString("admin_id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setRole(User.UserRole.fromString(rs.getString("role")));
        user.setDepartment(rs.getString("department"));
        user.setYear(rs.getString("year"));
        user.setType(rs.getString("type"));
        
        Date birthDate = rs.getDate("birth_date");
        if (birthDate != null) {
            user.setBirthDate(birthDate.toLocalDate());
        }
        
        user.setProfilePicture(rs.getString("profile_picture"));
        
        String adminLevelStr = rs.getString("admin_level");
        if (adminLevelStr != null) {
            user.setAdminLevel(User.AdminLevel.fromString(adminLevelStr));
        }
        
        user.setActive(rs.getBoolean("is_active"));
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            user.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            user.setUpdatedAt(updatedAt.toLocalDateTime());
        }
        
        return user;
    }
}