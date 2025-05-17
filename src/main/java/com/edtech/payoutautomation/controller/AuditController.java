package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.AuditLog;

import com.edtech.payoutautomation.repository.AuditLogRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/audit")
public class AuditController {

  @Autowired
  private AuditLogRepository auditLogRepository;

  @Autowired
  private UserRepository userRepository;

  @GetMapping
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
    List<AuditLog> auditLogs = auditLogRepository.findAll();
    return ResponseEntity.ok(auditLogs);
  }

  @GetMapping("/{id}")
  public ResponseEntity<AuditLog> getAuditLogById(@PathVariable Long id) {
    AuditLog auditLog = auditLogRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit log not found"));
    return ResponseEntity.ok(auditLog);
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable Long userId) {
    // Validate user exists
    if (!userRepository.existsById(userId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
    }

    List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    return ResponseEntity.ok(auditLogs);
  }

  @GetMapping("/date-range")
  public ResponseEntity<List<AuditLog>> getAuditLogsByDateRange(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    List<AuditLog> auditLogs = auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate);
    return ResponseEntity.ok(auditLogs);
  }

  @GetMapping("/entity/{entityType}/{entityId}")
  public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(
      @PathVariable AuditLog.EntityType entityType,
      @PathVariable Long entityId) {

    List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
    return ResponseEntity.ok(auditLogs);
  }
}