package com.edtech.payoutautomation.service;

import com.edtech.payoutautomation.model.AuditLog;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

  @Autowired
  private AuditLogRepository auditLogRepository;

  @Autowired
  private ObjectMapper objectMapper;

  /**
   * Log a general action with before/after values
   */
  public AuditLog logAction(
      AuditLog.EntityType entityType,
      Long entityId,
      AuditLog.ActionType action,
      User user,
      Object previousValue,
      Object newValue,
      String fieldName,
      String notes) {

    AuditLog auditLog = new AuditLog();
    auditLog.setEntityType(entityType);
    auditLog.setEntityId(entityId);
    auditLog.setAction(action);
    auditLog.setUser(user);
    auditLog.setTimestamp(LocalDateTime.now());
    auditLog.setFieldName(fieldName);
    auditLog.setNotes(notes);

    // Convert objects to JSON strings for storage
    try {
      if (previousValue != null) {
        auditLog.setPreviousValue(objectMapper.writeValueAsString(previousValue));
      }

      if (newValue != null) {
        auditLog.setNewValue(objectMapper.writeValueAsString(newValue));
      }
    } catch (JsonProcessingException e) {
      // Log error but continue
      System.err.println("Error serializing audit values: " + e.getMessage());
      auditLog.setPreviousValue("Error serializing value");
      auditLog.setNewValue("Error serializing value");
    }

    return auditLogRepository.save(auditLog);
  }

  /**
   * Log an entity creation
   */
  public AuditLog logCreation(AuditLog.EntityType entityType, Long entityId, User user, Object entity, String notes) {
    return logAction(
        entityType,
        entityId,
        AuditLog.ActionType.CREATE,
        user,
        null,
        entity,
        "entity",
        notes);
  }

  /**
   * Log a manual override
   */
  public AuditLog logManualOverride(AuditLog.EntityType entityType, Long entityId, User user, String field,
      Object oldValue, Object newValue, String reason) {
    return logAction(
        entityType,
        entityId,
        AuditLog.ActionType.MANUAL_OVERRIDE,
        user,
        oldValue,
        newValue,
        field,
        reason);
  }

  /**
   * Log a status change
   */
  public AuditLog logStatusChange(AuditLog.EntityType entityType, Long entityId, User user,
      String oldStatus, String newStatus, String notes) {
    return logAction(
        entityType,
        entityId,
        AuditLog.ActionType.STATUS_CHANGE,
        user,
        oldStatus,
        newStatus,
        "status",
        notes);
  }

  /**
   * Get audit history for an entity
   */
  public List<AuditLog> getAuditHistory(AuditLog.EntityType entityType, Long entityId) {
    return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
  }

  /**
   * Get audit logs by user
   */
  public List<AuditLog> getAuditLogsByUser(Long userId) {
    return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
  }

  /**
   * Get audit logs by date range
   */
  public List<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
    return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate);
  }

  /**
   * Get audit logs by action type
   */
  public List<AuditLog> getAuditLogsByAction(AuditLog.ActionType action) {
    return auditLogRepository.findByActionOrderByTimestampDesc(action);
  }
}