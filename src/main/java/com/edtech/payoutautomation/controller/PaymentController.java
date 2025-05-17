package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.AuditLog;
import com.edtech.payoutautomation.model.Payment;
import com.edtech.payoutautomation.model.Session;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.AuditLogRepository;
import com.edtech.payoutautomation.repository.PaymentRepository;
import com.edtech.payoutautomation.repository.SessionRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import com.edtech.payoutautomation.service.PaymentGatewayService;
import com.edtech.payoutautomation.service.ReceiptService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Payout;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

  @Autowired
  private PaymentRepository paymentRepository;

  @Autowired
  private SessionRepository sessionRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AuditLogRepository auditLogRepository;

  @Autowired
  private PaymentGatewayService paymentGatewayService;

  @Autowired
  private ReceiptService receiptService;

  @GetMapping
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<?> getAllPayments(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "id") String sortBy,
      @RequestParam(defaultValue = "desc") String direction) {

    try {
      // Create Pageable object
      org.springframework.data.domain.Sort.Direction sortDirection = direction.equalsIgnoreCase("asc")
          ? org.springframework.data.domain.Sort.Direction.ASC
          : org.springframework.data.domain.Sort.Direction.DESC;

      org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
          org.springframework.data.domain.Sort.by(sortDirection, sortBy));

      // Get paginated payments
      org.springframework.data.domain.Page<Payment> paymentsPage = paymentRepository.findAll(pageable);

      // Create response with pagination metadata
      Map<String, Object> response = new HashMap<>();
      response.put("payments", paymentsPage.getContent());
      response.put("currentPage", paymentsPage.getNumber());
      response.put("totalItems", paymentsPage.getTotalElements());
      response.put("totalPages", paymentsPage.getTotalPages());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      logger.error("Error retrieving paginated payments", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Failed to retrieve payments: " + e.getMessage()));
    }
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
    Payment payment = paymentRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    // Check if user is a mentor and the payment belongs to them
    if (hasRole("ROLE_MENTOR") && !isPaymentRecipient(payment)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    return ResponseEntity.ok(payment);
  }

  @GetMapping("/mentor/{mentorId}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #mentorId == authentication.principal.id)")
  public ResponseEntity<List<Payment>> getPaymentsByMentor(@PathVariable Long mentorId) {
    User mentor = userRepository.findById(mentorId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not found"));

    List<Payment> payments = paymentRepository.findByMentor(mentor);
    return ResponseEntity.ok(payments);
  }

  @GetMapping("/mentor/{mentorId}/status/{status}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or (hasRole('ROLE_MENTOR') and #mentorId == authentication.principal.id)")
  public ResponseEntity<List<Payment>> getPaymentsByMentorAndStatus(
      @PathVariable Long mentorId,
      @PathVariable Payment.PaymentStatus status) {
    User mentor = userRepository.findById(mentorId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not found"));

    List<Payment> payments = paymentRepository.findByMentorAndStatus(mentor, status);
    return ResponseEntity.ok(payments);
  }

  @GetMapping("/date-range")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<List<Payment>> getPaymentsByDateRange(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    List<Payment> payments = paymentRepository.findAll().stream()
        .filter(p -> !p.getPaymentDate().isBefore(startDate) && !p.getPaymentDate().isAfter(endDate))
        .collect(java.util.stream.Collectors.toList());
    return ResponseEntity.ok(payments);
  }

  @PostMapping
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Map<String, Object>> createPayment(@Valid @RequestBody Payment payment,
      HttpServletRequest request) {
    // Set current admin as processor
    User currentUser = getCurrentUser();
    payment.setProcessedBy(currentUser);

    // Verify mentor has bank details
    User mentor = payment.getMentor();
    if (mentor != null) {
      mentor = userRepository.findById(mentor.getId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not found"));

      // Check if bank details are complete
      if (mentor.getAccountNumber() == null || mentor.getAccountNumber().isEmpty() ||
          mentor.getBankName() == null || mentor.getBankName().isEmpty() ||
          mentor.getAccountHolderName() == null || mentor.getAccountHolderName().isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Mentor does not have complete bank details. Payment cannot be processed.");
      }

      // Set the mentor with complete details
      payment.setMentor(mentor);
    }

    // Calculate payment amounts
    if (payment.getTotalAmount() != null) {
      // Store original total amount as baseAmount
      payment.setBaseAmount(payment.getTotalAmount());

      // Calculate GST deduction (18%)
      BigDecimal gstRate = new BigDecimal("0.18");
      BigDecimal gstAmount = payment.getTotalAmount().multiply(gstRate);
      payment.setGstAmount(gstAmount);
      payment.setGstRate("18%");

      // Calculate platform fee (10%)
      BigDecimal platformFeeRate = new BigDecimal("0.10");
      BigDecimal platformFee = payment.getTotalAmount().multiply(platformFeeRate);
      payment.setPlatformFee(platformFee);
      payment.setPlatformFeeRate("10%");

      // Calculate final payable amount: totalAmount - GST - platformFee
      BigDecimal payableAmount = payment.getTotalAmount().subtract(gstAmount).subtract(platformFee);
      // Update totalAmount to reflect the actual payable amount
      payment.setTotalAmount(payableAmount);
    }

    // Store the list of sessions but DO NOT update their status yet
    List<Session> fullSessions = null;

    // Load complete session objects (but don't mark as PAID yet)
    if (payment.getSessions() != null && !payment.getSessions().isEmpty()) {
      // Create a new list of fully loaded sessions - use ArrayList (mutable) instead
      // of toList() (immutable)
      fullSessions = payment.getSessions().stream()
          .map(sessionRef -> sessionRepository.findById(sessionRef.getId())
              .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                  "Session not found with ID: " + sessionRef.getId())))
          .collect(java.util.stream.Collectors.toList());

      // Verify sessions are in APPROVED status
      for (Session session : fullSessions) {
        if (session.getStatus() != Session.SessionStatus.APPROVED) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "Session ID " + session.getId() + " is not in APPROVED status. Only approved sessions can be paid.");
        }
      }

      // Replace the session references with fully loaded sessions
      payment.setSessions(fullSessions);
    }

    // Add a note about the payment method/bank details used
    String bankDetailsNote = "";
    if (mentor != null) {
      bankDetailsNote = "Payment processed to account: " +
          mentor.getBankName() + " - " +
          mentor.getAccountNumber() + " (" +
          mentor.getAccountHolderName() + ")";

      // Append to existing notes or create new
      if (payment.getNotes() != null && !payment.getNotes().isEmpty()) {
        payment.setNotes(payment.getNotes() + "\n" + bankDetailsNote);
      } else {
        payment.setNotes(bankDetailsNote);
      }
    }

    // Save the payment first to get an ID
    Payment savedPayment = paymentRepository.save(payment);

    // Create audit log for the payment creation
    createAuditLog("CREATE", "Created payment with ID: " + savedPayment.getId(),
        AuditLog.EntityType.PAYMENT, savedPayment.getId(), request);

    // Create a payment intent with Stripe or process directly
    Map<String, Object> response = new HashMap<>();

    try {
      // Check if Stripe is enabled
      if (paymentGatewayService.isStripeEnabled()) {
        // Process with Stripe
        try {
          PaymentIntent intent = paymentGatewayService.createPaymentIntent(savedPayment);

          // Update the payment with the Stripe payment intent ID
          savedPayment.setTransactionId(intent.getId());
          savedPayment = paymentRepository.save(savedPayment);

          // Return both the payment and the client secret
          response.put("payment", savedPayment);
          response.put("clientSecret", intent.getClientSecret());
          response.put("useStripe", true);

        } catch (StripeException e) {
          // Log the stripe error but continue with direct payment
          System.out.println("Stripe error (falling back to direct payment): " + e.getMessage());
          processDirectPayment(savedPayment, response);

          // Now that payment is successful, update session statuses
          updateSessionStatusesToPaid(fullSessions);
        }
      } else {
        // Process without Stripe
        processDirectPayment(savedPayment, response);

        // Now that payment is successful, update session statuses
        updateSessionStatusesToPaid(fullSessions);
      }

      return ResponseEntity.status(HttpStatus.CREATED).body(response);

    } catch (Exception e) {
      // If any other error occurs, mark the payment as failed
      savedPayment.setStatus(Payment.PaymentStatus.FAILED);

      // Capture detailed error message
      String errorMessage = e.getMessage();
      if (errorMessage == null || errorMessage.isEmpty()) {
        errorMessage = "Unknown payment processing error: " + e.getClass().getSimpleName();
      }

      savedPayment.setNotes((savedPayment.getNotes() != null ? savedPayment.getNotes() + "\n" : "")
          + "Payment error: " + errorMessage);
      paymentRepository.save(savedPayment);

      // Create audit log for the failure
      createAuditLog("PAYMENT_FAILED", "Payment error: " + errorMessage,
          AuditLog.EntityType.PAYMENT, savedPayment.getId(), request);

      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Payment error: " + errorMessage);
    }
  }

  // Helper method to update session statuses to PAID
  private void updateSessionStatusesToPaid(List<Session> sessions) {
    // Only proceed if there are sessions to update
    if (sessions != null && !sessions.isEmpty()) {
      // Update the status of each loaded session
      sessions.forEach(session -> {
        session.setStatus(Session.SessionStatus.PAID);
        sessionRepository.save(session);
      });
    }
  }

  // Helper method to process direct payment (without Stripe)
  private void processDirectPayment(Payment payment, Map<String, Object> response) {
    // Process the payment directly
    Map<String, Object> result = paymentGatewayService.processDirectPayment(payment);

    // Update the payment with the transaction ID
    payment.setTransactionId((String) result.get("transactionId"));
    payment.setStatus(Payment.PaymentStatus.COMPLETED);
    Payment updatedPayment = paymentRepository.save(payment);

    // Add to response
    response.put("payment", updatedPayment);
    response.put("useStripe", false);
    response.put("directPayment", result);
  }

  @PostMapping("/{id}/process-stripe-payment")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Map<String, Object>> processStripePayment(
      @PathVariable Long id,
      @RequestParam String paymentIntentId,
      HttpServletRequest request) {

    Payment payment = paymentRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment already completed");
    }

    Map<String, Object> response = new HashMap<>();

    try {
      if (paymentGatewayService.isStripeEnabled()) {
        // Process with Stripe
        try {
          // Update payment status
          payment.setStatus(Payment.PaymentStatus.COMPLETED);
          payment.setTransactionId(paymentIntentId);

          // Create payout to mentor
          User mentor = payment.getMentor();
          Payout payout = paymentGatewayService.createMentorPayout(payment, mentor);

          // Update payment with payout details
          payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
              + "Payout created: " + payout.getId());

          payment = paymentRepository.save(payment);

          // Create audit log for stripe payment
          createAuditLog("PAYMENT_COMPLETED", "Payment processed successfully via Stripe",
              AuditLog.EntityType.PAYMENT, payment.getId(), request);

          response.put("paymentMethod", "stripe");

        } catch (StripeException e) {
          // If Stripe fails, fall back to direct payment
          processDirectPayout(payment, response, request);
        }
      } else {
        // Process without Stripe
        processDirectPayout(payment, response, request);
      }

      // Add payment to response
      response.put("payment", payment);
      response.put("message", "Payment processed successfully");

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      // Handle other errors
      payment.setStatus(Payment.PaymentStatus.FAILED);
      payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
          + "Payment processing error: " + e.getMessage());
      paymentRepository.save(payment);

      createAuditLog("PAYMENT_FAILED", "Payment processing error: " + e.getMessage(),
          AuditLog.EntityType.PAYMENT, payment.getId(), request);

      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Payment processing error: " + e.getMessage());
    }
  }

  // Helper method to process direct payout (without Stripe)
  private void processDirectPayout(Payment payment, Map<String, Object> response, HttpServletRequest request) {
    User mentor = payment.getMentor();

    // Process the direct payout
    Map<String, Object> result = paymentGatewayService.processDirectPayout(payment, mentor);

    // Create a detailed payment note
    StringBuilder paymentNote = new StringBuilder();

    // Add existing notes if any
    if (payment.getNotes() != null && !payment.getNotes().isEmpty()) {
      paymentNote.append(payment.getNotes()).append("\n");
    }

    // Add payout details
    paymentNote.append(result.get("message")).append("\n");

    // Add deduction details
    if (payment.getBaseAmount() != null) {
      paymentNote.append("Original Amount: ").append(payment.getBaseAmount()).append(" INR\n");

      if (payment.getGstAmount() != null) {
        paymentNote.append("GST Deduction (").append(payment.getGstRate()).append("): ")
            .append(payment.getGstAmount()).append(" INR\n");
      }

      if (payment.getPlatformFee() != null) {
        paymentNote.append("Platform Fee (").append(payment.getPlatformFeeRate()).append("): ")
            .append(payment.getPlatformFee()).append(" INR\n");
      }

      paymentNote.append("Final Payable Amount: ").append(payment.getTotalAmount()).append(" INR");
    }

    // Update payment with payout details
    payment.setStatus(Payment.PaymentStatus.COMPLETED);
    payment.setNotes(paymentNote.toString());

    payment = paymentRepository.save(payment);

    // Create audit log
    createAuditLog("PAYMENT_COMPLETED", "Payment processed via direct bank transfer",
        AuditLog.EntityType.PAYMENT, payment.getId(), request);

    response.put("paymentMethod", "direct");
    response.put("directPayout", result);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Payment> updatePayment(
      @PathVariable Long id,
      @Valid @RequestBody Payment paymentDetails,
      HttpServletRequest request) {

    Payment payment = paymentRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    payment.setTotalAmount(paymentDetails.getTotalAmount());
    payment.setPaymentDate(paymentDetails.getPaymentDate());
    payment.setTransactionId(paymentDetails.getTransactionId());
    payment.setStatus(paymentDetails.getStatus());
    payment.setReceiptUrl(paymentDetails.getReceiptUrl());
    payment.setNotes(paymentDetails.getNotes());

    Payment updatedPayment = paymentRepository.save(payment);

    // Create audit log
    createAuditLog("UPDATE", "Updated payment with ID: " + updatedPayment.getId(),
        AuditLog.EntityType.PAYMENT, updatedPayment.getId(), request);

    return ResponseEntity.ok(updatedPayment);
  }

  @PutMapping("/{id}/status")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Payment> updatePaymentStatus(
      @PathVariable Long id,
      @RequestParam Payment.PaymentStatus status,
      HttpServletRequest request) {

    Payment payment = paymentRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    payment.setStatus(status);
    Payment updatedPayment = paymentRepository.save(payment);

    // Create audit log
    createAuditLog("STATUS_UPDATE", "Updated payment status to " + status + " for payment ID: " + id,
        AuditLog.EntityType.PAYMENT, id, request);

    return ResponseEntity.ok(updatedPayment);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Map<String, Boolean>> deletePayment(@PathVariable Long id, HttpServletRequest request) {
    Payment payment = paymentRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    // Update associated sessions back to APPROVED status
    if (payment.getSessions() != null && !payment.getSessions().isEmpty()) {
      // For each session reference, load the full session data
      payment.getSessions().forEach(sessionRef -> {
        Session fullSession = sessionRepository.findById(sessionRef.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Session not found with ID: " + sessionRef.getId()));

        fullSession.setStatus(Session.SessionStatus.APPROVED);
        sessionRepository.save(fullSession);
      });
    }

    paymentRepository.delete(payment);

    // Create audit log
    createAuditLog("DELETE", "Deleted payment with ID: " + id,
        AuditLog.EntityType.PAYMENT, id, request);

    Map<String, Boolean> response = new HashMap<>();
    response.put("deleted", Boolean.TRUE);

    return ResponseEntity.ok(response);
  }

  // Webhook endpoint for Stripe events
  @PostMapping("/webhook")
  public ResponseEntity<String> handleStripeWebhook(
      @RequestBody String payload,
      @RequestHeader("Stripe-Signature") String sigHeader) {

    if (!paymentGatewayService.verifyWebhookSignature(payload, sigHeader)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
    }

    // In a real application, you would parse the event and handle different event
    // types
    // For this demo, we'll just acknowledge receipt

    return ResponseEntity.ok("Webhook received");
  }

  // Helper methods

  private boolean hasRole(String roleName) {
    return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals(roleName));
  }

  private boolean isPaymentRecipient(Payment payment) {
    User currentUser = getCurrentUser();
    return payment.getMentor().getId().equals(currentUser.getId());
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

  // Generate a receipt for a payment
  @PostMapping("/{id}/generate-receipt")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<?> generateReceipt(@PathVariable Long id) {
    try {
      // Get the current user (admin)
      UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
      User admin = userRepository.findByUsername(userDetails.getUsername())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

      // Find the payment
      Payment payment = paymentRepository.findById(id)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

      // Generate the receipt
      String receiptUrl = receiptService.generateReceipt(payment, admin);

      // Return success with the receipt URL
      return ResponseEntity.ok(Map.of(
          "success", true,
          "receiptUrl", receiptUrl));
    } catch (Exception e) {
      logger.error("Error generating receipt", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Failed to generate receipt: " + e.getMessage()));
    }
  }

  // Send a receipt to the mentor via email
  @PostMapping("/{id}/send-receipt")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<?> sendReceipt(
      @PathVariable Long id,
      @RequestParam(required = false) String customMessage,
      @RequestBody(required = false) Map<String, String> requestBody) {

    // If customMessage is null but exists in request body, use that instead
    if (customMessage == null && requestBody != null && requestBody.containsKey("customMessage")) {
      customMessage = requestBody.get("customMessage");
    }

    try {
      // Get the current user (admin)
      UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
      User admin = userRepository.findByUsername(userDetails.getUsername())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

      // Find the payment
      Payment payment = paymentRepository.findById(id)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

      // Check if receipt exists
      if (payment.getReceiptUrl() == null || payment.getReceiptUrl().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(Map.of("message", "Generate a receipt first before sending"));
      }

      // Send the receipt
      try {
        // Call the method directly
        boolean sent = receiptService.sendReceiptEmail(payment, admin, customMessage);
        
        if (sent) {
          logger.info("Receipt sent successfully to {}", payment.getMentor().getEmail());
          return ResponseEntity.ok(Map.of(
              "success", true,
              "message", "Receipt sent successfully to " + payment.getMentor().getEmail()));
        } else {
          logger.warn("Receipt sending returned false but did not throw an exception");
          return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("message", "Failed to send receipt: Unknown error"));
        }
      } catch (jakarta.mail.MessagingException emailError) {
        // Log with the cause for better debugging
        if (emailError.getCause() != null) {
          logger.error("Email sending error: {} - Cause: {}", 
              emailError.getMessage(), 
              emailError.getCause().getMessage());
        } else {
          logger.error("Email sending error: {}", emailError.getMessage());
        }
        
        String errorMessage = emailError.getMessage();
        
        if (errorMessage == null || errorMessage.isEmpty()) {
          errorMessage = "Unknown email error. Please check email configuration.";
        }
        
        // Return a more detailed error message
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("message", "Failed to send email: " + errorMessage));
      }
    } catch (Exception e) {
      logger.error("Error sending receipt", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Failed to send receipt: " + e.getMessage()));
    }
  }

  // Simulate a payment with tax and fee calculations
  @PostMapping("/simulate")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<Payment> simulatePayment(@Valid @RequestBody Payment payment) {
    try {
      // Run the simulation
      Payment simulatedPayment = receiptService.simulatePayment(payment);

      // Return the simulated payment
      return ResponseEntity.ok(simulatedPayment);
    } catch (Exception e) {
      logger.error("Error simulating payment", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  // Get audit history for a payment
  @GetMapping("/{id}/audit")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  public ResponseEntity<?> getPaymentAudit(@PathVariable Long id) {
    try {
      // Verify the payment exists
      if (!paymentRepository.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
      }

      // Get audit logs
      List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityId(
          AuditLog.EntityType.PAYMENT, id);

      return ResponseEntity.ok(auditLogs);
    } catch (Exception e) {
      logger.error("Error fetching audit logs", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Failed to fetch audit logs: " + e.getMessage()));
    }
  }
}