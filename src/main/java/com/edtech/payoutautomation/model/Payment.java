package com.edtech.payoutautomation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "payment_sessions", joinColumns = @JoinColumn(name = "payment_id"), inverseJoinColumns = @JoinColumn(name = "session_id"))
    private List<Session> sessions;

    @NotNull
    private BigDecimal totalAmount;

    // Base amount before taxes and fees
    private BigDecimal baseAmount;

    // Tax information
    private BigDecimal gstAmount;
    private String gstRate; // e.g., "18%"

    // Platform fee
    private BigDecimal platformFee;
    private String platformFeeRate; // e.g., "5%"

    // Other deductions
    private BigDecimal otherDeductions;
    private String deductionDetails;

    @NotNull
    private LocalDateTime paymentDate;

    private String transactionId;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.PENDING;

    private String receiptUrl;

    private String notes;

    // Email status for receipt
    private Boolean receiptSent = false;
    private LocalDateTime receiptSentAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    // Flag for simulation/test mode
    private Boolean isSimulation = false;

    public enum PaymentStatus {
        PENDING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}