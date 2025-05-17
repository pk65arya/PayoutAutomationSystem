package com.edtech.payoutautomation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotNull
  @Enumerated(EnumType.STRING)
  private EntityType entityType;

  @NotNull
  private Long entityId;

  @NotNull
  @Enumerated(EnumType.STRING)
  private ActionType action;

  @NotNull
  private LocalDateTime timestamp = LocalDateTime.now();

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(columnDefinition = "TEXT")
  private String previousValue;

  @Column(columnDefinition = "TEXT")
  private String newValue;

  private String fieldName;

  @Column(columnDefinition = "TEXT")
  private String notes;

  // Type of entity being audited
  public enum EntityType {
    PAYMENT,
    SESSION,
    USER,
    MENTOR_PROFILE,
    SYSTEM_SETTING,
    MESSAGE
  }

  // Type of action performed
  public enum ActionType {
    CREATE,
    UPDATE,
    DELETE,
    STATUS_CHANGE,
    MANUAL_OVERRIDE,
    RECEIPT_GENERATED,
    RECEIPT_SENT
  }
}