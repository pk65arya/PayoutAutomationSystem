package com.edtech.payoutautomation.service;

import com.edtech.payoutautomation.model.Payment;
import com.edtech.payoutautomation.model.User;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Payout;
import com.stripe.net.Webhook;
import com.stripe.exception.SignatureVerificationException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

@Service
public class PaymentGatewayService {
  private static final Logger logger = Logger.getLogger(PaymentGatewayService.class.getName());

  @Value("${stripe.api.key:dummy_key_replace_in_properties}")
  private String stripeApiKey;

  @Value("${stripe.webhook.secret:dummy_webhook_secret}")
  private String webhookSecret;

  private boolean stripeEnabled = false;

  @PostConstruct
  public void init() {
    if (isValidApiKey(stripeApiKey)) {
      try {
        Stripe.apiKey = stripeApiKey;
        stripeEnabled = true;
        logger.info("Stripe API initialized successfully");
      } catch (Exception e) {
        logger.warning("Stripe API initialization failed: " + e.getMessage());
        stripeEnabled = false;
      }
    } else {
      logger.warning("Stripe API key not properly configured, falling back to direct payments");
      stripeEnabled = false;
    }
  }

  private boolean isValidApiKey(String apiKey) {
    return apiKey != null && !apiKey.isEmpty() && !apiKey.startsWith("dummy_");
  }

  /**
   * Create a payment intent for processing a payment
   *
   * @param payment The payment to process
   * @return The payment intent
   */
  public PaymentIntent createPaymentIntent(Payment payment) throws StripeException {
    if (!stripeEnabled) {
      throw new IllegalStateException("Stripe integration not enabled");
    }

    try {
      // Validate payment has required fields
      if (payment == null) {
        throw new IllegalArgumentException("Payment cannot be null");
      }

      if (payment.getTotalAmount() == null) {
        throw new IllegalArgumentException("Payment amount cannot be null");
      }

      if (payment.getMentor() == null) {
        throw new IllegalArgumentException("Payment must have a mentor associated");
      }

      // Convert amount to cents/smallest currency unit as required by Stripe
      long amountInCents = payment.getTotalAmount().multiply(new BigDecimal("100")).longValue();

      Map<String, Object> params = new HashMap<>();
      params.put("amount", amountInCents);
      params.put("currency", "inr");
      params.put("description", "Payment for mentor ID: " + payment.getMentor().getId());

      Map<String, String> metadata = new HashMap<>();
      metadata.put("paymentId", payment.getId().toString());
      metadata.put("mentorId", payment.getMentor().getId().toString());
      params.put("metadata", metadata);

      // Log the request parameters
      logger.info("Creating Stripe payment intent for payment ID: " + payment.getId() +
          ", amount: " + amountInCents + " cents");

      PaymentIntent intent = PaymentIntent.create(params);
      logger.info("Successfully created payment intent: " + intent.getId());

      return intent;
    } catch (StripeException e) {
      logger.severe("Stripe error creating payment intent: " + e.getMessage());
      throw e; // Re-throw the StripeException directly
    } catch (Exception e) {
      logger.severe("Error creating payment intent: " + e.getMessage());
      throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
    }
  }

  /**
   * Process a direct payment without using Stripe
   * 
   * @param payment The payment to process
   * @return A map with transaction details
   */
  public Map<String, Object> processDirectPayment(Payment payment) {
    if (payment == null) {
      logger.severe("Cannot process direct payment: payment is null");
      throw new IllegalArgumentException("Payment cannot be null");
    }

    if (payment.getTotalAmount() == null) {
      logger.severe("Cannot process direct payment: payment amount is null");
      throw new IllegalArgumentException("Payment amount cannot be null");
    }

    Map<String, Object> result = new HashMap<>();
    String transactionId = "DIR" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    result.put("transactionId", transactionId);
    result.put("status", "completed");
    result.put("message", "Payment processed directly (Stripe not enabled)");
    result.put("amount", payment.getTotalAmount());
    result.put("currency", "INR");
    result.put("paymentMethod", "direct");

    logger.info("Processed direct payment with transaction ID: " + transactionId);
    return result;
  }

  /**
   * Process a payout to a mentor using Stripe
   *
   * @param payment The payment to process
   * @param mentor  The mentor to pay
   * @return The payout object
   */
  public Payout createMentorPayout(Payment payment, User mentor) throws StripeException {
    if (!stripeEnabled) {
      throw new IllegalStateException("Stripe integration not enabled");
    }

    try {
      // Validate parameters
      if (payment == null) {
        throw new IllegalArgumentException("Payment cannot be null");
      }

      if (payment.getTotalAmount() == null) {
        throw new IllegalArgumentException("Payment amount cannot be null");
      }

      if (mentor == null) {
        throw new IllegalArgumentException("Mentor cannot be null");
      }

      // Convert amount to cents/smallest currency unit as required by Stripe
      long amountInCents = payment.getTotalAmount().multiply(new BigDecimal("100")).longValue();

      Map<String, Object> params = new HashMap<>();
      params.put("amount", amountInCents);
      params.put("currency", "inr");

      // In production, you'd use the mentor's connected account
      // params.put("destination", mentor.getStripeAccountId());

      // For demo - using description to show bank details
      String description = "Payout to: " + mentor.getFullName() +
          " (" + mentor.getBankName() + " - " +
          mentor.getAccountNumber() + ")";
      params.put("description", description);

      // Log payout attempt
      logger.info("Creating Stripe payout for payment ID: " + payment.getId() +
          ", amount: " + amountInCents + " cents, mentor: " + mentor.getId());

      Payout payout = Payout.create(params);
      logger.info("Successfully created payout: " + payout.getId());

      return payout;
    } catch (StripeException e) {
      logger.severe("Stripe error creating payout: " + e.getMessage());
      throw e; // Re-throw the StripeException directly
    } catch (Exception e) {
      logger.severe("Error creating payout: " + e.getMessage());
      throw new RuntimeException("Failed to create payout: " + e.getMessage(), e);
    }
  }

  /**
   * Process a direct payout without using Stripe
   * 
   * @param payment The payment to process
   * @param mentor  The mentor being paid
   * @return A map with payout details
   */
  public Map<String, Object> processDirectPayout(Payment payment, User mentor) {
    // Validate parameters
    if (payment == null) {
      logger.severe("Cannot process direct payout: payment is null");
      throw new IllegalArgumentException("Payment cannot be null");
    }

    if (payment.getTotalAmount() == null) {
      logger.severe("Cannot process direct payout: payment amount is null");
      throw new IllegalArgumentException("Payment amount cannot be null");
    }

    if (mentor == null) {
      logger.severe("Cannot process direct payout: mentor is null");
      throw new IllegalArgumentException("Mentor cannot be null");
    }

    Map<String, Object> result = new HashMap<>();
    String payoutId = "PO" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    result.put("payoutId", payoutId);
    result.put("status", "completed");

    // Create a detailed message including payment breakdown
    StringBuilder message = new StringBuilder();
    message.append("Direct payout to: ").append(mentor.getFullName())
        .append(" via ").append(mentor.getBankName())
        .append(" (Acc: ").append(mentor.getAccountNumber()).append(")");

    // Add payment details to result object
    result.put("message", message.toString());
    result.put("paymentAmount", payment.getTotalAmount());
    result.put("currency", "INR");
    result.put("paymentMethod", "direct");

    // Add deduction details to result if available
    if (payment.getBaseAmount() != null) {
      result.put("originalAmount", payment.getBaseAmount());

      if (payment.getGstAmount() != null && payment.getGstRate() != null) {
        result.put("gstAmount", payment.getGstAmount());
        result.put("gstRate", payment.getGstRate());
      }

      if (payment.getPlatformFee() != null && payment.getPlatformFeeRate() != null) {
        result.put("platformFee", payment.getPlatformFee());
        result.put("platformFeeRate", payment.getPlatformFeeRate());
      }
    }

    logger.info("Processed direct payout with ID: " + payoutId);
    return result;
  }

  /**
   * Check if Stripe integration is enabled
   * 
   * @return true if Stripe is enabled
   */
  public boolean isStripeEnabled() {
    return stripeEnabled;
  }

  /**
   * Verify Stripe webhook signature
   * 
   * @param payload   The webhook payload
   * @param sigHeader The Stripe signature header
   * @return true if the signature is valid
   */
  public boolean verifyWebhookSignature(String payload, String sigHeader) {
    if (!stripeEnabled || webhookSecret == null || webhookSecret.startsWith("dummy_")) {
      logger.warning("Webhook verification not enabled");
      return false;
    }

    try {
      // Add the default tolerance parameter (5 minutes in seconds)
      Webhook.Signature.verifyHeader(payload, sigHeader, webhookSecret, 300);
      return true;
    } catch (SignatureVerificationException e) {
      logger.warning("Webhook signature verification failed: " + e.getMessage());
      return false;
    }
  }
}