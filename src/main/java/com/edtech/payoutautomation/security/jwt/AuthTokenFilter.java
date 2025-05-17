package com.edtech.payoutautomation.security.jwt;

import com.edtech.payoutautomation.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Enumeration;

public class AuthTokenFilter extends OncePerRequestFilter {
  @Autowired
  private JwtUtils jwtUtils;

  @Autowired
  private UserDetailsServiceImpl userDetailsService;

  private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
    String path = request.getRequestURI();
    logger.debug("Checking path for filtering: {}", path);

    // Skip filter for static resources and public endpoints
    boolean shouldSkip = path.equals("/") ||
        path.equals("/index.html") ||
        path.endsWith(".js") ||
        path.endsWith(".css") ||
        path.endsWith(".html") ||
        path.endsWith(".ico") ||
        path.endsWith(".png") ||
        path.endsWith(".jpg") ||
        path.startsWith("/css/") ||
        path.startsWith("/js/") ||
        path.startsWith("/images/") ||
        path.startsWith("/static/") ||
        path.startsWith("/public/") ||
        (path.startsWith("/api/auth/") && !path.equals("/api/auth/verify")); // Allow auth verify to be authenticated

    if (shouldSkip) {
      logger.debug("Skipping authentication filter for: {}", path);
    } else {
      logger.debug("Will apply authentication filter for: {}", path);
    }
    return shouldSkip;
  }

  @Override
  protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    try {
      // Log the request URL to help with debugging
      logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURL());

      // Log all headers for debugging (only in development)
      if (logger.isDebugEnabled()) {
        logger.debug("Request headers:");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
          String headerName = headerNames.nextElement();
          logger.debug("  {}: {}", headerName, request.getHeader(headerName));
        }
      }

      // Only process JWT for paths that should be filtered
      if (!shouldNotFilter(request)) {
        String jwt = parseJwt(request);
        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
          String username = jwtUtils.getUserNameFromJwtToken(jwt);
          logger.debug("JWT token valid for user: {}", username);

          UserDetails userDetails = userDetailsService.loadUserByUsername(username);
          UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
              userDetails, null, userDetails.getAuthorities());
          authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

          SecurityContextHolder.getContext().setAuthentication(authentication);
          logger.debug("Authentication successful for user: {}", username);
          logger.debug("User authorities: {}", userDetails.getAuthorities());
        } else if (jwt != null) {
          logger.warn("Invalid JWT token in request");
        } else {
          logger.debug("No JWT token found in request");
        }
      } else {
        logger.debug("Skipping JWT authentication for permitted path: {}", request.getRequestURI());
      }
    } catch (Exception e) {
      logger.error("Cannot set user authentication: {}", e.getMessage());
      logger.error("Authentication error details", e);
    }

    filterChain.doFilter(request, response);
  }

  private String parseJwt(HttpServletRequest request) {
    String headerAuth = request.getHeader("Authorization");
    logger.debug("Authorization header: {}", headerAuth);

    if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
      String token = headerAuth.substring(7);
      logger.debug("JWT token extracted from request: {}",
          token.length() > 10 ? token.substring(0, 10) + "..." : token);
      return token;
    }

    return null;
  }
}