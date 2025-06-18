package com.mlvisiotrack.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class JsonResponse {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    static {
        objectMapper.registerModule(new JavaTimeModule());
    }
    
    public static void sendSuccess(HttpServletResponse response, Object data) throws IOException {
        sendSuccess(response, data, null, 200);
    }
    
    public static void sendSuccess(HttpServletResponse response, Object data, String message) throws IOException {
        sendSuccess(response, data, message, 200);
    }
    
    public static void sendSuccess(HttpServletResponse response, Object data, String message, int statusCode) throws IOException {
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("data", data);
        
        if (message != null) {
            responseMap.put("message", message);
        }
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(statusCode);
        
        objectMapper.writeValue(response.getWriter(), responseMap);
    }
    
    public static void sendError(HttpServletResponse response, int statusCode, String message) throws IOException {
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", false);
        responseMap.put("message", message);
        responseMap.put("data", null);
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(statusCode);
        
        objectMapper.writeValue(response.getWriter(), responseMap);
    }
}