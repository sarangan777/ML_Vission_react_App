package com.mlvisiotrack.config;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ApplicationContextListener implements ServletContextListener {
    private static final Logger logger = LoggerFactory.getLogger(ApplicationContextListener.class);
    
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        logger.info("🚀 Initializing MLVisioTrack Backend...");
        
        try {
            // Load application properties
            Properties properties = loadProperties();
            
            // Initialize database
            DatabaseConfig.initialize(properties);
            
            // Initialize Firebase
            FirebaseConfig.initialize(properties);
            
            // Store properties in servlet context
            sce.getServletContext().setAttribute("appProperties", properties);
            
            logger.info("✅ MLVisioTrack Backend initialized successfully");
            
        } catch (Exception e) {
            logger.error("❌ Failed to initialize application", e);
            throw new RuntimeException("Application initialization failed", e);
        }
    }
    
    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        logger.info("🛑 Shutting down MLVisioTrack Backend...");
        
        try {
            DatabaseConfig.shutdown();
            logger.info("✅ Application shutdown completed");
        } catch (Exception e) {
            logger.error("❌ Error during application shutdown", e);
        }
    }
    
    private Properties loadProperties() throws IOException {
        Properties properties = new Properties();
        
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("application.properties")) {
            if (input == null) {
                throw new IOException("application.properties file not found");
            }
            properties.load(input);
        }
        
        return properties;
    }
}