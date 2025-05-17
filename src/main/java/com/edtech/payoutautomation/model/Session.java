package com.edtech.payoutautomation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sessions")
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @NotBlank
    private String sessionType;

    @NotNull
    private Duration duration;

    @NotNull
    private BigDecimal hourlyRate;

    @NotNull
    private LocalDateTime sessionDateTime;

    @NotNull
    private LocalDate recordedDate;

    private BigDecimal calculatedAmount;

    private BigDecimal platformFee;

    private BigDecimal gstAmount;

    private BigDecimal deductions;

    private BigDecimal finalPayoutAmount;

    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.PENDING;

    private String notes;

    @PrePersist
    @PreUpdate
    public void calculateAmounts() {
        // Convert duration to hours
        double durationInHours = duration.toMinutes() / 60.0;

        // Calculate base amount
        this.calculatedAmount = hourlyRate.multiply(BigDecimal.valueOf(durationInHours));

        // Platform fee calculation (10% of calculated amount)
        this.platformFee = calculatedAmount.multiply(BigDecimal.valueOf(0.1));

        // GST calculation (18% of calculated amount)
        this.gstAmount = calculatedAmount.multiply(BigDecimal.valueOf(0.18));

        // Calculate final payout amount
        this.finalPayoutAmount = calculatedAmount.subtract(platformFee)
                .subtract(deductions == null ? BigDecimal.ZERO : deductions);
    }

    public enum SessionStatus {
        PENDING,
        APPROVED,
        PAID,
        REJECTED
    }
}