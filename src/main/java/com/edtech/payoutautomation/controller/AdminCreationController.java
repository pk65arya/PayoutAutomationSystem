package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.ERole;
import com.edtech.payoutautomation.model.Role;
import com.edtech.payoutautomation.model.Session;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.payload.response.MessageResponse;
import com.edtech.payoutautomation.repository.RoleRepository;
import com.edtech.payoutautomation.repository.SessionRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Development-only controller to create admin users
 * IMPORTANT: Remove or secure this controller in production
 */
@RestController
@RequestMapping("/api/public/setup")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminCreationController {
  private static final Logger logger = LoggerFactory.getLogger(AdminCreationController.class);

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private RoleRepository roleRepository;

  @Autowired
  private SessionRepository sessionRepository;

  @Autowired
  private PasswordEncoder encoder;

  @PostMapping("/create-admin")
  public ResponseEntity<?> createAdmin(
      @RequestParam String username,
      @RequestParam String email,
      @RequestParam String password,
      @RequestParam String fullName,
      @RequestParam(required = false) String secretKey) {

    // Optional: Add a secret key validation to prevent unauthorized creation
    if (secretKey != null && !secretKey.equals("your-secret-setup-key")) {
      return ResponseEntity.badRequest().body(new MessageResponse("Invalid secret key"));
    }

    logger.info("Creating admin user: {}", username);

    // Check if username exists
    if (userRepository.existsByUsername(username)) {
      return ResponseEntity.badRequest().body(new MessageResponse("Username already exists"));
    }

    // Check if email exists
    if (userRepository.existsByEmail(email)) {
      return ResponseEntity.badRequest().body(new MessageResponse("Email already exists"));
    }

    // Create new admin user
    User user = new User(username, email, encoder.encode(password), fullName);

    // Assign ADMIN role
    Set<Role> roles = new HashSet<>();
    Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
        .orElseThrow(() -> new RuntimeException("Admin role not found"));
    roles.add(adminRole);
    user.setRoles(roles);

    userRepository.save(user);
    logger.info("Admin user created successfully: {}", username);

    return ResponseEntity.ok(new MessageResponse("Admin user created successfully"));
  }

  /**
   * Creates sample test data including mentors and sessions.
   * WARNING: This is for development purposes only and should be removed in
   * production.
   */
  @PostMapping("/create-sample-data")
  public ResponseEntity<?> createSampleData() {
    logger.info("Creating sample data for testing");

    try {
      // 1. Create mentor user if it doesn't exist
      User mentor = null;
      if (!userRepository.existsByUsername("mentor")) {
        // Get mentor role
        Role mentorRole = roleRepository.findByName(ERole.ROLE_MENTOR)
            .orElseThrow(() -> new RuntimeException("Mentor role not found"));

        // Create mentor user
        mentor = new User(
            "mentor",
            "mentor@example.com",
            encoder.encode("mentor123"),
            "Test Mentor");

        Set<Role> roles = new HashSet<>();
        roles.add(mentorRole);
        mentor.setRoles(roles);
        mentor.setPhoneNumber("9876543210");
        mentor.setBankName("Test Bank");
        mentor.setAccountNumber("1234567890");
        mentor.setAccountHolderName(mentor.getFullName());
        mentor.setIfscCode("TESTIFSC123");
        mentor.setAccountType("SAVINGS");
        mentor.setTaxIdentificationNumber("ABCDE1234F");

        mentor = userRepository.save(mentor);
        logger.info("Created test mentor user");
      } else {
        mentor = userRepository.findByUsername("mentor")
            .orElseThrow(() -> new RuntimeException("Mentor not found"));
      }

      // 2. Create sample sessions
      // Only create if less than 5 sessions exist
      if (sessionRepository.findByMentor(mentor).size() < 5) {
        for (int i = 0; i < 5; i++) {
          Session session = new Session();
          session.setMentor(mentor);
          session.setSessionType("Online Teaching");
          session.setDuration(Duration.ofMinutes(60));
          session.setHourlyRate(new BigDecimal("1000.00"));
          session.setSessionDateTime(LocalDateTime.now().minusDays(i));
          session.setRecordedDate(LocalDate.now().minusDays(i));
          session.setDeductions(BigDecimal.ZERO);

          // Set different statuses for each session
          switch (i % 4) {
            case 0:
              session.setStatus(Session.SessionStatus.PENDING);
              break;
            case 1:
              session.setStatus(Session.SessionStatus.APPROVED);
              break;
            case 2:
              session.setStatus(Session.SessionStatus.PAID);
              break;
            case 3:
              session.setStatus(Session.SessionStatus.REJECTED);
              break;
          }

          session.setNotes("Sample session " + (i + 1));
          sessionRepository.save(session);
        }
        logger.info("Created 5 sample sessions for testing");
      }

      return ResponseEntity.ok(new MessageResponse("Sample data created successfully"));
    } catch (Exception e) {
      logger.error("Error creating sample data", e);
      return ResponseEntity.badRequest().body(new MessageResponse("Error creating sample data: " + e.getMessage()));
    }
  }
}