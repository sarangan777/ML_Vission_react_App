package com.mlvisiotrack.filters;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Properties;

public class CorsFilter implements Filter {
    private String allowedOrigins;
    private String allowedMethods;
    private String allowedHeaders;
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        Properties appProperties = (Properties) filterConfig.getServletContext().getAttribute("appProperties");
        
        allowedOrigins = appProperties.getProperty("cors.allowed.origins", "*");
        allowedMethods = appProperties.getProperty("cors.allowed.methods", "GET,POST,PUT,DELETE,OPTIONS");
        allowedHeaders = appProperties.getProperty("cors.allowed.headers", "Content-Type,Authorization,X-Requested-With");
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Set CORS headers
        httpResponse.setHeader("Access-Control-Allow-Origin", allowedOrigins);
        httpResponse.setHeader("Access-Control-Allow-Methods", allowedMethods);
        httpResponse.setHeader("Access-Control-Allow-Headers", allowedHeaders);
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        httpResponse.setHeader("Access-Control-Max-Age", "3600");
        
        // Handle preflight requests
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        
        chain.doFilter(request, response);
    }
    
    @Override
    public void destroy() {
        // Cleanup if needed
    }
}