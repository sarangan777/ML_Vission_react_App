package com.mlvisiotrack.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    private static HikariDataSource dataSource;
    
    public static void initialize(Properties properties) {
        try {
            HikariConfig config = new HikariConfig();
            
            String host = properties.getProperty("db.host", "localhost");
            String port = properties.getProperty("db.port", "3306");
            String dbName = properties.getProperty("db.name", "mlvisiotrack");
            String username = properties.getProperty("db.username", "root");
            String password = properties.getProperty("db.password", "");
            
            String jdbcUrl = String.format("jdbc:mysql://%s:%s/%s?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true", 
                                         host, port, dbName);
            
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            
            // Connection pool settings
            config.setMaximumPoolSize(Integer.parseInt(properties.getProperty("db.pool.maxSize", "20")));
            config.setMinimumIdle(Integer.parseInt(properties.getProperty("db.pool.minIdle", "5")));
            config.setConnectionTimeout(30000);
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);
            
            // Connection validation
            config.setConnectionTestQuery("SELECT 1");
            config.setValidationTimeout(5000);
            
            dataSource = new HikariDataSource(config);
            
            // Test connection
            try (Connection conn = dataSource.getConnection()) {
                logger.info("✅ MySQL Database connected successfully");
            }
            
        } catch (Exception e) {
            logger.error("❌ Failed to initialize database connection", e);
            throw new RuntimeException("Database initialization failed", e);
        }
    }
    
    public static Connection getConnection() throws SQLException {
        if (dataSource == null) {
            throw new SQLException("DataSource not initialized");
        }
        return dataSource.getConnection();
    }
    
    public static void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            logger.info("Database connection pool closed");
        }
    }
}