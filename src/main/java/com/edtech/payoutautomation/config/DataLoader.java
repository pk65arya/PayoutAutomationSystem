package com.edtech.payoutautomation.config;

import com.edtech.payoutautomation.model.ERole;
import com.edtech.payoutautomation.model.Role;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.RoleRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

  private static final Logger logger = LoggerFactory.getLogger(DataLoader.class);

  @Autowired
  private RoleRepository roleRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Override
  public void run(String... args) {
    logger.info("Initializing database with default roles and admin user");

    // Initialize roles if they don't exist
    if (roleRepository.count() == 0) {
      logger.info("Creating default roles");
      Role adminRole = new Role(ERole.ROLE_ADMIN);
      Role mentorRole = new Role(ERole.ROLE_MENTOR);

      roleRepository.save(adminRole);
      roleRepository.save(mentorRole);

      logger.info("Roles initialized successfully");
    } else {
      logger.info("Roles already exist in database, skipping initialization");
    }

    // Create default admin user if no users exist
    if (userRepository.count() == 0) {
      logger.info("Creating default admin user");

      // Check if admin role exists
      Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
          .orElseThrow(() -> new RuntimeException("Error: Admin Role not found."));

      User adminUser = new User(
          "admin",
          "admin@edtech.com",
          passwordEncoder.encode("admin123"),
          "Admin User");

      Set<Role> roles = new HashSet<>();
      roles.add(adminRole);
      adminUser.setRoles(roles);

      userRepository.save(adminUser);

      logger.info("Default admin user created successfully");
    } else {
      logger.info("Users already exist in database, skipping admin user creation");
    }
  }
}