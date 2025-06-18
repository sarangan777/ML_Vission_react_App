package com.mlvisiotrack.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class FirebaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    private static Firestore firestore;
    
    public static void initialize(Properties properties) {
        try {
            String projectId = properties.getProperty("firebase.project.id");
            String credentialsPath = properties.getProperty("firebase.credentials.path");
            
            if (projectId == null || credentialsPath == null) {
                throw new IllegalArgumentException("Firebase configuration is missing");
            }
            
            FileInputStream serviceAccount = new FileInputStream(credentialsPath);
            
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId(projectId)
                    .build();
            
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            
            firestore = FirestoreClient.getFirestore();
            logger.info("✅ Firebase Firestore connected successfully");
            
        } catch (IOException e) {
            logger.error("❌ Failed to initialize Firebase", e);
            throw new RuntimeException("Firebase initialization failed", e);
        }
    }
    
    public static Firestore getFirestore() {
        if (firestore == null) {
            throw new RuntimeException("Firestore not initialized");
        }
        return firestore;
    }
}