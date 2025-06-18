package com.mlvisiotrack.filters;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.mlvisiotrack.dao.UserDAO;
import com.mlvisiotrack.models.User;
import com.mlvisiotrack.utils.JsonResponse;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Properties;

public class AuthFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(AuthFilter.class);
    private String jwtSecret;
    private UserDAO userDAO;
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        Properties appProperties = (Properties) filterConfig.getServletContext().getAttribute("appProperties");
        jwtSecret = appProperties.getProperty("jwt.secret");
        userDAO = new UserDAO();
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                JsonResponse.sendError(httpResponse, 401, "Access denied. No token provided.");
                return;
            }
            
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Verify JWT token
            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT decodedJWT = verifier.verify(token);
            
            String userId = decodedJWT.getSubject();
            String role = decodedJWT.getClaim("role").asString();
            String email = decodedJWT.getClaim("email").asString();
            
            // Verify user still exists and is active
            User user = userDAO.findById(userId);
            if (user == null || !user.isActive()) {
                JsonResponse.sendError(httpResponse, 401, "Access denied. User not found or inactive.");
                return;
            }
            
            // Set user information in request attributes
            httpRequest.setAttribute("userId", userId);
            httpRequest.setAttribute("userRole", role);
            httpRequest.setAttribute("userEmail", email);
            
            chain.doFilter(request, response);
            
        } catch (JWTVerificationException e) {
            logger.warn("JWT verification failed: {}", e.getMessage());
            JsonResponse.sendError(httpResponse, 401, "Access denied. Invalid or expired token.");
        } catch (Exception e) {
            logger.error("Error in AuthFilter", e);
            JsonResponse.sendError(httpResponse, 500, "Internal server error");
        }
    }
    
    @Override
    public void destroy() {
        // Cleanup if needed
    }
}