package com.edtech.payoutautomation.repository;

import com.edtech.payoutautomation.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

  List<AuditLog> findByEntityTypeAndEntityId(AuditLog.EntityType entityType, Long entityId);

  List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(AuditLog.EntityType entityType, Long entityId);

  List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);

  List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startDate, LocalDateTime endDate);

  List<AuditLog> findByActionOrderByTimestampDesc(AuditLog.ActionType action);
}