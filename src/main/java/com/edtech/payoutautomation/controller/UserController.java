package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.AuditLog;
import com.edtech.payoutautomation.model.ERole;
import com.edtech.payoutautomation.model.Role;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.AuditLogRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AuditLogRepository auditLogRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @GetMapping
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<?> getAllUsers(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "username") String sortBy,
      @RequestParam(defaultValue = "asc") String direction,
      @RequestParam(defaultValue = "false") boolean paginate) {

    try {
      // Create Pageable object
      org.springframework.data.domain.Sort.Direction sortDirection = direction.equalsIgnoreCase("asc")
          ? org.springframework.data.domain.Sort.Direction.ASC
          : org.springframework.data.domain.Sort.Direction.DESC;

      org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
          org.springframework.data.domain.Sort.by(sortDirection, sortBy));

      // Get paginated users
      org.springframework.data.domain.Page<User> usersPage = userRepository.findAll(pageable);

      // Don't return passwords in response
      usersPage.getContent().forEach(user -> user.setPassword(null));

      // If paginate parameter is true, return paginated format, otherwise return
      // simple array format
      // This handles compatibility with frontend code expecting an array directly
      if (paginate) {
        // Create response with pagination metadata
        Map<String, Object> response = new HashMap<>();
        response.put("users", usersPage.getContent());
        response.put("currentPage", usersPage.getNumber());
        response.put("totalItems", usersPage.getTotalElements());
        response.put("totalPages", usersPage.getTotalPages());
        return ResponseEntity.ok(response);
      } else {
        // Return a direct array of users for compatibility with frontend filter() calls
        return ResponseEntity.ok(usersPage.getContent());
      }
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Failed to retrieve users: " + e.getMessage()));
    }
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #id == authentication.principal.id)")
  public ResponseEntity<User> getUserById(@PathVariable Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    // Don't return password in response
    user.setPassword(null);
    return ResponseEntity.ok(user);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #id == authentication.principal.id)")
  public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails,
      HttpServletRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    // Only admins can change roles
    if (!hasRole("ROLE_ADMIN")) {
      userDetails.setRoles(user.getRoles());
    }

    // Preserve existing username and password if not provided
    if (userDetails.getUsername() == null || userDetails.getUsername().isEmpty()) {
      userDetails.setUsername(user.getUsername());
    }

    // Don't update password through this endpoint
    userDetails.setPassword(user.getPassword());

    user.setFullName(userDetails.getFullName());
    user.setEmail(userDetails.getEmail());
    user.setPhoneNumber(userDetails.getPhoneNumber());

    // Update structured bank details
    user.setBankName(userDetails.getBankName());
    user.setAccountNumber(userDetails.getAccountNumber());
    user.setAccountHolderName(userDetails.getAccountHolderName());
    user.setIfscCode(userDetails.getIfscCode());
    user.setBranchName(userDetails.getBranchName());
    user.setSwiftCode(userDetails.getSwiftCode());
    user.setAccountType(userDetails.getAccountType());

    user.setTaxIdentificationNumber(userDetails.getTaxIdentificationNumber());

    User updatedUser = userRepository.save(user);

    // Create audit log
    createAuditLog("UPDATE", "Updated user with ID: " + updatedUser.getId(),
        AuditLog.EntityType.USER, updatedUser.getId(), request);

    // Don't return password in response
    updatedUser.setPassword(null);
    return ResponseEntity.ok(updatedUser);
  }

  @PutMapping("/{id}/password")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #id == authentication.principal.id)")
  public ResponseEntity<Map<String, Boolean>> updatePassword(
      @PathVariable Long id,
      @RequestParam String oldPassword,
      @RequestParam String newPassword,
      HttpServletRequest request) {

    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect old password");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    // Create audit log
    createAuditLog("PASSWORD_UPDATE", "Updated password for user with ID: " + id,
        AuditLog.EntityType.USER, id, request);

    Map<String, Boolean> response = new HashMap<>();
    response.put("success", Boolean.TRUE);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id, HttpServletRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    userRepository.delete(user);

    // Create audit log
    createAuditLog("DELETE", "Deleted user with ID: " + id,
        AuditLog.EntityType.USER, id, request);

    Map<String, Boolean> response = new HashMap<>();
    response.put("deleted", Boolean.TRUE);

    return ResponseEntity.ok(response);
  }

  @GetMapping("/admins")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<List<User>> getAdminUsers() {
    try {
      System.out.println("==== Getting admin users ====");
      System.out.println("Current user authorities: " +
          SecurityContextHolder.getContext().getAuthentication().getAuthorities());

      List<User> users = userRepository.findAll();
      System.out.println("Total users found: " + users.size());

      // Ensure users exist
      if (users.isEmpty()) {
        System.out.println("WARNING: No users at all found in the database!");
        return ResponseEntity.ok(List.of());
      }

      // Debug all users
      System.out.println("All users in system:");
      users.forEach(user -> {
        System.out.println("User: " + user.getUsername() + ", ID: " + user.getId() +
            ", Email: " + user.getEmail() + ", Roles: " + user.getRoles());
      });

      // Filter users with admin role and don't return passwords
      List<User> admins = users.stream()
          .filter(user -> {
            boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> {
                  if (role == null) {
                    return false;
                  }

                  // For Role objects
                  if (role instanceof Role) {
                    boolean result = ((Role) role).getName().equals(ERole.ROLE_ADMIN);
                    System.out.println("User " + user.getUsername() + " role check (Role object): " +
                        ((Role) role).getName() + " equals ROLE_ADMIN: " + result);
                    return result;
                  }
                  // For String representations or other formats
                  else {
                    String roleStr = role.toString();
                    boolean result = roleStr.contains("ADMIN") || roleStr.contains("ROLE_ADMIN");
                    System.out.println("User " + user.getUsername() + " role check (String): " +
                        roleStr + " contains ADMIN: " + result);
                    return result;
                  }
                });

            if (isAdmin) {
              System.out.println("User " + user.getUsername() + " is an admin");
            } else {
              System.out.println("User " + user.getUsername() + " is NOT an admin");
            }
            return isAdmin;
          })
          .peek(user -> user.setPassword(null))
          .toList();

      System.out.println("Returning " + admins.size() + " admin users");

      // If no admins found, check if we should create a default admin
      if (admins.isEmpty()) {
        System.out.println("WARNING: No admin users found in the system!");
        System.out.println("Creating a default admin user for testing");

        // Create a default admin for testing if no admins exist
        User defaultAdmin = new User();
        defaultAdmin.setId(999L); // Use a dummy ID for frontend testing
        defaultAdmin.setUsername("admin");
        defaultAdmin.setEmail("admin@example.com");
        defaultAdmin.setFullName("Default Admin");

        Set<Role> roles = new HashSet<>();
        Role adminRole = new Role();
        adminRole.setId(1);
        adminRole.setName(ERole.ROLE_ADMIN);
        roles.add(adminRole);
        defaultAdmin.setRoles(roles);

        return ResponseEntity.ok(List.of(defaultAdmin));
      }

      // Log each admin user we're returning
      for (User admin : admins) {
        System.out.println("Admin user: " + admin.getUsername() + " (ID: " + admin.getId() + ")");
      }

      return ResponseEntity.ok(admins);
    } catch (Exception e) {
      // Log the error
      System.err.println("Error fetching admin users: " + e.getMessage());
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(List.of());
    }
  }

  // Helper methods

  private boolean hasRole(String roleName) {
    return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals(roleName));
  }

  private User getCurrentUser() {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserDetails) {
      String username = ((UserDetails) principal).getUsername();
      return userRepository.findByUsername(username)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
  }

  private void createAuditLog(String action, String details, AuditLog.EntityType entityType, Long entityId,
      HttpServletRequest request) {
    User currentUser = getCurrentUser();

    AuditLog auditLog = new AuditLog();
    auditLog.setUser(currentUser);
    auditLog.setAction(AuditLog.ActionType.valueOf(action));
    auditLog.setNotes(details);
    auditLog.setTimestamp(LocalDateTime.now());
    auditLog.setEntityType(entityType);
    auditLog.setEntityId(entityId);

    auditLogRepository.save(auditLog);
  }
}