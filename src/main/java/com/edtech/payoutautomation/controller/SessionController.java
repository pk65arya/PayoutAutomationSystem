package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.AuditLog;
import com.edtech.payoutautomation.model.Session;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.AuditLogRepository;
import com.edtech.payoutautomation.repository.SessionRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/sessions")
public class SessionController {

  @Autowired
  private SessionRepository sessionRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AuditLogRepository auditLogRepository;

  @GetMapping
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<?> getAllSessions(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "sessionDateTime") String sortBy,
      @RequestParam(defaultValue = "desc") String direction) {

    try {
      // Create Pageable object
      org.springframework.data.domain.Sort.Direction sortDirection = direction.equalsIgnoreCase("asc")
          ? org.springframework.data.domain.Sort.Direction.ASC
          : org.springframework.data.domain.Sort.Direction.DESC;

      org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
          org.springframework.data.domain.Sort.by(sortDirection, sortBy));

      // Get paginated sessions
      org.springframework.data.domain.Page<Session> sessionsPage = sessionRepository.findAll(pageable);

      // Create response with pagination metadata
      Map<String, Object> response = new HashMap<>();
      response.put("sessions", sessionsPage.getContent());
      response.put("currentPage", sessionsPage.getNumber());
      response.put("totalItems", sessionsPage.getTotalElements());
      response.put("totalPages", sessionsPage.getTotalPages());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Failed to retrieve sessions: " + e.getMessage()));
    }
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Session> getSessionById(@PathVariable Long id) {
    Session session = sessionRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    // Check if user is a mentor and the session belongs to them
    if (hasRole("ROLE_MENTOR") && !isSessionOwner(session)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    return ResponseEntity.ok(session);
  }

  @GetMapping("/mentor/{mentorId}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #mentorId == authentication.principal.id)")
  public ResponseEntity<List<Session>> getSessionsByMentor(@PathVariable Long mentorId) {
    User mentor = userRepository.findById(mentorId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not found"));

    List<Session> sessions = sessionRepository.findByMentor(mentor);
    return ResponseEntity.ok(sessions);
  }

  @GetMapping("/mentor/{mentorId}/status/{status}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #mentorId == authentication.principal.id)")
  public ResponseEntity<List<Session>> getSessionsByMentorAndStatus(
      @PathVariable Long mentorId,
      @PathVariable Session.SessionStatus status) {
    User mentor = userRepository.findById(mentorId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not found"));

    List<Session> sessions = sessionRepository.findByMentorAndStatus(mentor, status);
    return ResponseEntity.ok(sessions);
  }

  @GetMapping("/date-range")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<List<Session>> getSessionsByDateRange(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
      @RequestParam(required = false) Session.SessionStatus status) {

    List<Session> sessions;
    if (status != null) {
      sessions = sessionRepository.findByStatusAndDateRange(status, startDate, endDate);
    } else {
      sessions = sessionRepository.findAll().stream()
          .filter(s -> !s.getRecordedDate().isBefore(startDate) && !s.getRecordedDate().isAfter(endDate))
          .toList();
    }
    return ResponseEntity.ok(sessions);
  }

  @PostMapping
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Session> createSession(@Valid @RequestBody Session session, HttpServletRequest request) {
    // Ensure calculated fields are properly set
    session.calculateAmounts();

    Session savedSession = sessionRepository.save(session);

    // Create audit log
    createAuditLog("CREATE", "Created session with ID: " + savedSession.getId(),
        AuditLog.EntityType.SESSION, savedSession.getId(), request);

    return ResponseEntity.status(HttpStatus.CREATED).body(savedSession);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Session> updateSession(
      @PathVariable Long id,
      @Valid @RequestBody Session sessionDetails,
      HttpServletRequest request) {

    Session session = sessionRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    session.setSessionType(sessionDetails.getSessionType());
    session.setDuration(sessionDetails.getDuration());
    session.setHourlyRate(sessionDetails.getHourlyRate());
    session.setSessionDateTime(sessionDetails.getSessionDateTime());
    session.setRecordedDate(sessionDetails.getRecordedDate());
    session.setDeductions(sessionDetails.getDeductions());
    session.setStatus(sessionDetails.getStatus());
    session.setNotes(sessionDetails.getNotes());

    // Recalculate amounts
    session.calculateAmounts();

    Session updatedSession = sessionRepository.save(session);

    // Create audit log
    createAuditLog("UPDATE", "Updated session with ID: " + updatedSession.getId(),
        AuditLog.EntityType.SESSION, updatedSession.getId(), request);

    return ResponseEntity.ok(updatedSession);
  }

  @PutMapping("/{id}/status")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Session> updateSessionStatus(
      @PathVariable Long id,
      @RequestParam Session.SessionStatus status,
      HttpServletRequest request) {

    Session session = sessionRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    session.setStatus(status);
    Session updatedSession = sessionRepository.save(session);

    // Create audit log
    createAuditLog("STATUS_UPDATE", "Updated session status to " + status + " for session ID: " + id,
        AuditLog.EntityType.SESSION, id, request);

    return ResponseEntity.ok(updatedSession);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Map<String, Boolean>> deleteSession(@PathVariable Long id, HttpServletRequest request) {
    Session session = sessionRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

    sessionRepository.delete(session);

    // Create audit log
    createAuditLog("DELETE", "Deleted session with ID: " + id,
        AuditLog.EntityType.SESSION, id, request);

    Map<String, Boolean> response = new HashMap<>();
    response.put("deleted", Boolean.TRUE);

    return ResponseEntity.ok(response);
  }

  @PostMapping("/calculate")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Map<String, BigDecimal>> calculateSessionAmount(
      @RequestParam int durationMinutes,
      @RequestParam BigDecimal hourlyRate) {

    // Convert duration to hours
    double durationInHours = durationMinutes / 60.0;

    // Calculate base amount
    BigDecimal calculatedAmount = hourlyRate.multiply(BigDecimal.valueOf(durationInHours));

    // Platform fee calculation (10% of calculated amount)
    BigDecimal platformFee = calculatedAmount.multiply(BigDecimal.valueOf(0.1));

    // GST calculation (18% of calculated amount)
    BigDecimal gstAmount = calculatedAmount.multiply(BigDecimal.valueOf(0.18));

    // Calculate final payout amount
    BigDecimal finalPayoutAmount = calculatedAmount.subtract(platformFee);

    Map<String, BigDecimal> result = new HashMap<>();
    result.put("calculatedAmount", calculatedAmount);
    result.put("platformFee", platformFee);
    result.put("gstAmount", gstAmount);
    result.put("finalPayoutAmount", finalPayoutAmount);

    return ResponseEntity.ok(result);
  }

  // Helper methods

  private boolean hasRole(String roleName) {
    return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals(roleName));
  }

  private boolean isSessionOwner(Session session) {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserDetails) {
      String username = ((UserDetails) principal).getUsername();
      User currentUser = userRepository.findByUsername(username)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

      return session.getMentor().getId().equals(currentUser.getId());
    }
    return false;
  }

  private void createAuditLog(String action, String details, AuditLog.EntityType entityType, Long entityId,
      HttpServletRequest request) {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserDetails) {
      String username = ((UserDetails) principal).getUsername();
      User currentUser = userRepository.findByUsername(username)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
}