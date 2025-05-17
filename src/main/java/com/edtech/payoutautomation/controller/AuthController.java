package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.ERole;
import com.edtech.payoutautomation.model.Role;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.payload.request.LoginRequest;
import com.edtech.payoutautomation.payload.request.SignupRequest;
import com.edtech.payoutautomation.payload.response.JwtResponse;
import com.edtech.payoutautomation.payload.response.MessageResponse;
import com.edtech.payoutautomation.repository.RoleRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import com.edtech.payoutautomation.security.jwt.JwtUtils;
import com.edtech.payoutautomation.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;

  @Autowired
  RoleRepository roleRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @PostMapping("/signin")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
    logger.info("Authentication attempt for user: {}", loginRequest.getUsername());

    try {
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

      SecurityContextHolder.getContext().setAuthentication(authentication);
      // Generate JWT token with extended expiration (24 hours)
      String jwt = jwtUtils.generateJwtToken(authentication, true);

      UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
      List<String> roles = userDetails.getAuthorities().stream()
          .map(item -> item.getAuthority())
          .collect(Collectors.toList());

      logger.info("User authenticated successfully: {}", userDetails.getUsername());

      return ResponseEntity.ok(new JwtResponse(jwt,
          userDetails.getId(),
          userDetails.getUsername(),
          userDetails.getEmail(),
          userDetails.getFullName(),
          roles));
    } catch (BadCredentialsException e) {
      logger.warn("Failed authentication attempt for user: {}", loginRequest.getUsername());
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid username or password"));
    } catch (Exception e) {
      logger.error("Authentication error: {}", e.getMessage());
      return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
    }
  }

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
    logger.info("Registration attempt for username: {}", signUpRequest.getUsername());

    // Validate username
    if (userRepository.existsByUsername(signUpRequest.getUsername())) {
      logger.warn("Registration failed - Username already exists: {}", signUpRequest.getUsername());
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Username is already taken!"));
    }

    // Validate email
    if (userRepository.existsByEmail(signUpRequest.getEmail())) {
      logger.warn("Registration failed - Email already in use: {}", signUpRequest.getEmail());
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    try {
      // Create new user's account
      User user = new User(signUpRequest.getUsername(),
          signUpRequest.getEmail(),
          encoder.encode(signUpRequest.getPassword()),
          signUpRequest.getFullName());

      Set<String> strRoles = signUpRequest.getRoles();
      Set<Role> roles = new HashSet<>();

      if (strRoles == null || strRoles.isEmpty()) {
        Role mentorRole = roleRepository.findByName(ERole.ROLE_MENTOR)
            .orElseThrow(() -> new RuntimeException("Error: Mentor Role is not found."));
        roles.add(mentorRole);
        logger.info("Assigning default MENTOR role to new user");
      } else {
        strRoles.forEach(role -> {
          switch (role) {
            case "admin":
              Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                  .orElseThrow(() -> new RuntimeException("Error: Admin Role is not found."));
              roles.add(adminRole);
              logger.info("Assigning ADMIN role to new user");
              break;
            default:
              Role mentorRole = roleRepository.findByName(ERole.ROLE_MENTOR)
                  .orElseThrow(() -> new RuntimeException("Error: Mentor Role is not found."));
              roles.add(mentorRole);
              logger.info("Assigning MENTOR role to new user");
          }
        });
      }

      user.setRoles(roles);
      user.setPhoneNumber(signUpRequest.getPhoneNumber());
      // Replace accountDetails with structured bank fields
      if (signUpRequest.getAccountDetails() != null) {
        // Temporarily parse from accountDetails field until SignupRequest is updated
        String details = signUpRequest.getAccountDetails();
        user.setBankName(details.contains("Bank:") ? details.split("Bank:")[1].split(",")[0].trim() : "");
        user.setAccountNumber(details.contains("Account:") ? details.split("Account:")[1].trim() : "");
        user.setAccountHolderName(user.getFullName());
      }
      user.setTaxIdentificationNumber(signUpRequest.getTaxIdentificationNumber());

      userRepository.save(user);
      logger.info("User registered successfully: {}", user.getUsername());

      return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    } catch (Exception e) {
      logger.error("Registration error: {}", e.getMessage(), e);
      return ResponseEntity.badRequest().body(new MessageResponse("Registration error: " + e.getMessage()));
    }
  }

  // Add a verify endpoint to check if the token is valid
  @GetMapping("/verify")
  public ResponseEntity<?> verifyToken() {
    try {
      // Get the current authenticated user
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      logger.debug("Verifying token. Authentication: {}", auth);

      if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetailsImpl) {
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        logger.info("Token verification successful for user: {}", userDetails.getUsername());

        // Return user details along with the valid token confirmation
        return ResponseEntity.ok(Map.of(
            "message", "Token is valid",
            "username", userDetails.getUsername(),
            "userId", userDetails.getId(),
            "roles", userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList())));
      } else {
        logger.warn("Token verification failed - invalid authentication. Auth: {}", auth);
        return ResponseEntity.status(401).body(new MessageResponse("Invalid token"));
      }
    } catch (Exception e) {
      logger.error("Error during token verification: {}", e.getMessage(), e);
      return ResponseEntity.status(401).body(new MessageResponse("Token verification error: " + e.getMessage()));
    }
  }

  // Add a refresh token endpoint to generate a new token for an authenticated
  // user
  @GetMapping("/refresh-token")
  public ResponseEntity<?> refreshToken() {
    try {
      // Get the current authenticated user
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      logger.info("Token refresh request received. Authentication: {}", auth.getName());

      if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetailsImpl) {
        // Generate new token
        String newToken = jwtUtils.generateJwtToken(auth);
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        logger.info("Token refreshed successfully for user: {}", userDetails.getUsername());

        // Create response with new token and user data
        Map<String, Object> response = new HashMap<>();
        response.put("token", newToken);
        response.put("userData", Map.of(
            "id", userDetails.getId(),
            "username", userDetails.getUsername(),
            "email", userDetails.getEmail(),
            "fullName", userDetails.getFullName(),
            "roles", userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList())));
        response.put("message", "Token refreshed successfully");

        return ResponseEntity.ok(response);
      } else {
        logger.warn("Token refresh failed - invalid authentication");
        return ResponseEntity.status(401).body(new MessageResponse("Authentication required"));
      }
    } catch (Exception e) {
      logger.error("Error during token refresh: {}", e.getMessage(), e);
      return ResponseEntity.status(401).body(new MessageResponse("Token refresh error: " + e.getMessage()));
    }
  }
}