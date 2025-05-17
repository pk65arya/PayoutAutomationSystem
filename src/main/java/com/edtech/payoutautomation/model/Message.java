package com.edtech.payoutautomation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "messages")
public class Message {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "sender_id", nullable = false)
  private User sender;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "recipient_id", nullable = false)
  private User recipient;

  @NotBlank
  @Column(columnDefinition = "TEXT")
  private String content;

  @NotNull
  private LocalDateTime sentAt;

  private LocalDateTime readAt;

  private boolean isRead = false;
}