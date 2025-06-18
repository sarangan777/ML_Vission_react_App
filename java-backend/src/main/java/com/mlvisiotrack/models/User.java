package com.mlvisiotrack.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class User {
    private String id;
    private String registrationNumber;
    private String adminId;
    private String name;
    private String email;
    
    @JsonIgnore
    private String passwordHash;
    
    private UserRole role;
    private String department;
    private String year;
    private String type;
    private LocalDate birthDate;
    private String profilePicture;
    private AdminLevel adminLevel;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public User() {}
    
    public User(String id, String name, String email, UserRole role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Enums
    public enum UserRole {
        STUDENT("student"),
        ADMIN("admin");
        
        private final String value;
        
        UserRole(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static UserRole fromString(String value) {
            for (UserRole role : UserRole.values()) {
                if (role.value.equalsIgnoreCase(value)) {
                    return role;
                }
            }
            throw new IllegalArgumentException("Invalid role: " + value);
        }
    }
    
    public enum AdminLevel {
        SUPER("super"),
        REGULAR("regular");
        
        private final String value;
        
        AdminLevel(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static AdminLevel fromString(String value) {
            for (AdminLevel level : AdminLevel.values()) {
                if (level.value.equalsIgnoreCase(value)) {
                    return level;
                }
            }
            return REGULAR; // Default
        }
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    @JsonIgnore
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    @JsonProperty("role")
    public String getRoleValue() { return role != null ? role.getValue() : null; }
    
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    
    @JsonProperty("adminLevel")
    public String getAdminLevelValue() { return adminLevel != null ? adminLevel.getValue() : null; }
    
    public AdminLevel getAdminLevel() { return adminLevel; }
    public void setAdminLevel(AdminLevel adminLevel) { this.adminLevel = adminLevel; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}