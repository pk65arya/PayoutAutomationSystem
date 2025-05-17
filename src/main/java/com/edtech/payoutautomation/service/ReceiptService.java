package com.edtech.payoutautomation.service;

import com.edtech.payoutautomation.model.AuditLog;
import com.edtech.payoutautomation.model.Payment;
import com.edtech.payoutautomation.model.Session;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

@Service
public class ReceiptService {

  @Autowired
  private PaymentRepository paymentRepository;

  @Autowired
  private AuditLogService auditLogService;

  @Autowired
  private JavaMailSender mailSender;

  @Autowired
  private TemplateEngine templateEngine;

  @Value("${app.receipts.storage-path:receipts}")
  private String receiptsStoragePath;

  @Value("${app.receipts.base-url:http://localhost:8080/receipts}")
  private String receiptsBaseUrl;

  @Value("${spring.mail.username:pk65arya@gmail.com}")
  private String fromEmail;

  /**
   * Generate a receipt PDF for a payment
   */
  public String generateReceipt(Payment payment, User admin) throws IOException {
    // Ensure directory exists
    Path dirPath = Paths.get(receiptsStoragePath);
    if (!Files.exists(dirPath)) {
      Files.createDirectories(dirPath);
    }

    // Create unique filename
    String filename = String.format("receipt_%d_%s.pdf",
        payment.getId(),
        UUID.randomUUID().toString().substring(0, 8));

    // Create full path
    Path filePath = dirPath.resolve(filename);

    System.out.println("Generating receipt for payment ID: " + payment.getId() + " at path: " + filePath);

    PDDocument document = null;

    try {
      document = new PDDocument();
      PDPage page = new PDPage(PDRectangle.A4);
      document.addPage(page);

      // Create content stream in a separate block to ensure it's closed before saving
      PDPageContentStream contentStream = null;
      try {
        contentStream = new PDPageContentStream(document, page);

        // Company header
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18);
        contentStream.newLineAtOffset(50, 750);
        contentStream.showText("EdTech Payout System");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, 730);
        contentStream.showText("Payment Receipt");
        contentStream.endText();

        // Mentor details
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        contentStream.newLineAtOffset(50, 700);
        String mentorName = payment.getMentor().getFullName() != null ? payment.getMentor().getFullName() : "Unknown";
        contentStream.showText("Mentor: " + mentorName);
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, 680);
        String mentorEmail = payment.getMentor().getEmail() != null ? payment.getMentor().getEmail()
            : "No email provided";
        contentStream.showText("Email: " + mentorEmail);
        contentStream.endText();

        // Payment Details
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        contentStream.newLineAtOffset(50, 650);
        contentStream.showText("Payment Details");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, 630);
        contentStream.showText("Payment ID: " + payment.getId());
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, 610);
        String paymentDate = payment.getPaymentDate() != null
            ? payment.getPaymentDate().format(DateTimeFormatter.ISO_DATE)
            : "N/A";
        contentStream.showText("Date: " + paymentDate);
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, 590);
        String status = payment.getStatus() != null ? payment.getStatus().toString() : "Unknown";
        contentStream.showText("Status: " + status);
        contentStream.endText();

        if (payment.getTransactionId() != null) {
          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA, 12);
          contentStream.newLineAtOffset(50, 570);
          contentStream.showText("Transaction ID: " + payment.getTransactionId());
          contentStream.endText();
        }

        // Sessions Table
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        contentStream.newLineAtOffset(50, 530);
        contentStream.showText("Sessions");
        contentStream.endText();

        float y = 510;
        float lineHeight = 20;

        // Table headers
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("Date");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        contentStream.newLineAtOffset(150, y);
        contentStream.showText("Type");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        contentStream.newLineAtOffset(250, y);
        contentStream.showText("Duration");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        contentStream.newLineAtOffset(350, y);
        contentStream.showText("Rate");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        contentStream.newLineAtOffset(450, y);
        contentStream.showText("Amount");
        contentStream.endText();

        y -= lineHeight;

        // Sessions rows
        for (Session session : payment.getSessions()) {
          // Session date
          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA, 10);
          contentStream.newLineAtOffset(50, y);
          contentStream.showText(session.getSessionDateTime().format(DateTimeFormatter.ISO_DATE));
          contentStream.endText();

          // Session type
          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA, 10);
          contentStream.newLineAtOffset(150, y);
          contentStream.showText(session.getSessionType());
          contentStream.endText();

          // Duration handling
          String duration = "N/A";
          if (session.getDuration() != null) {
            // Handle java.time.Duration properly
            try {
              java.time.Duration durationObj = (java.time.Duration) session.getDuration();
              long minutes = durationObj.toMinutes();
              duration = minutes + " min";
            } catch (Exception e) {
              // Fallback for other duration types
              duration = session.getDuration().toString();
            }
          }

          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA, 10);
          contentStream.newLineAtOffset(250, y);
          contentStream.showText(duration);
          contentStream.endText();

          // Rate
          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA, 10);
          contentStream.newLineAtOffset(350, y);
          contentStream.showText("Rs." + session.getHourlyRate() + "/hr");
          contentStream.endText();

          // Amount
          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA, 10);
          contentStream.newLineAtOffset(450, y);
          contentStream.showText("Rs." + session.getFinalPayoutAmount());
          contentStream.endText();

          y -= lineHeight;

          // Break if we're running out of space - future improvement would be multi-page
          if (y < 100)
            break;
        }

        // Payment Breakdown
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        contentStream.newLineAtOffset(50, y - 20);
        contentStream.showText("Payment Breakdown");
        contentStream.endText();

        y -= 40;

        // Calculate subtotal for sessions
        BigDecimal sessionsTotal = BigDecimal.ZERO;
        try {
          for (Session session : payment.getSessions()) {
            if (session.getFinalPayoutAmount() != null) {
              sessionsTotal = sessionsTotal.add(session.getFinalPayoutAmount());
            }
          }
        } catch (Exception e) {
          // In case of error, fall back to base amount
          sessionsTotal = payment.getBaseAmount() != null ? payment.getBaseAmount() : payment.getTotalAmount();
        }

        // Sessions subtotal
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("Sessions Subtotal:");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(450, y);
        contentStream.showText("Rs." + sessionsTotal);
        contentStream.endText();

        y -= lineHeight;

        // Base amount
        BigDecimal baseAmount = payment.getBaseAmount() != null ? payment.getBaseAmount() : payment.getTotalAmount();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("Base Amount:");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(450, y);
        contentStream.showText("Rs." + baseAmount);
        contentStream.endText();

        y -= lineHeight;

        // Add a separator line for subtotal section
        contentStream.setLineWidth(0.5f);
        contentStream.moveTo(450, y);
        contentStream.lineTo(550, y);
        contentStream.stroke();
        y -= lineHeight;

        // Ensure we have proper tax and fee values - calculate if not present
        // If GST rate is present but GST amount is missing or zero, calculate it
        String gstRateStr = payment.getGstRate();
        BigDecimal gstAmount = payment.getGstAmount();

        if ((gstRateStr != null && !gstRateStr.isEmpty()) &&
            (gstAmount == null || gstAmount.compareTo(BigDecimal.ZERO) == 0)) {
          try {
            // Parse rate (removing % if present)
            double gstRate = Double.parseDouble(gstRateStr.replace("%", "")) / 100.0;
            gstAmount = baseAmount.multiply(BigDecimal.valueOf(gstRate)).setScale(2, java.math.RoundingMode.HALF_UP);
            payment.setGstAmount(gstAmount);
          } catch (Exception e) {
            gstAmount = BigDecimal.ZERO;
          }
        }

        // Same for platform fee
        String platformFeeRateStr = payment.getPlatformFeeRate();
        BigDecimal platformFee = payment.getPlatformFee();

        if ((platformFeeRateStr != null && !platformFeeRateStr.isEmpty()) &&
            (platformFee == null || platformFee.compareTo(BigDecimal.ZERO) == 0)) {
          try {
            // Parse rate (removing % if present)
            double platformRate = Double.parseDouble(platformFeeRateStr.replace("%", "")) / 100.0;
            platformFee = baseAmount.multiply(BigDecimal.valueOf(platformRate)).setScale(2,
                java.math.RoundingMode.HALF_UP);
            payment.setPlatformFee(platformFee);
          } catch (Exception e) {
            platformFee = BigDecimal.ZERO;
          }
        }

        // Tax Section Header with more space
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("TAXES & FEES BREAKDOWN:");
        contentStream.endText();

        y -= lineHeight * 1.2;

        // Draw a box around the tax section
        float taxSectionStartY = y + 15;
        contentStream.setLineWidth(1f);
        contentStream.addRect(45, y - 90, 510, 115);
        contentStream.stroke();

        // GST - show even if zero
        BigDecimal gstAmt = (gstAmount != null) ? gstAmount : BigDecimal.ZERO;
        String gstRate = (gstRateStr != null && !gstRateStr.isEmpty()) ? gstRateStr : "0%";

        // Format GST label to right align values
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("GST (" + gstRate + "):");
        contentStream.endText();

        // Format GST amount with right alignment
        String gstAmtStr = "Rs." + gstAmt.toString();
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        float gstAmtWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(gstAmtStr) / 1000 * 12;
        contentStream.newLineAtOffset(550 - gstAmtWidth, y);
        contentStream.showText(gstAmtStr);
        contentStream.endText();

        y -= lineHeight * 1.2;

        // Platform fee - show even if zero
        BigDecimal platformFeeAmt = (platformFee != null) ? platformFee : BigDecimal.ZERO;
        String platformFeeRate = (platformFeeRateStr != null && !platformFeeRateStr.isEmpty())
            ? platformFeeRateStr
            : "0%";

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("Platform Fee (" + platformFeeRate + "):");
        contentStream.endText();

        // Format platform fee amount with right alignment
        String platformFeeStr = "Rs." + platformFeeAmt.toString();
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        float platformFeeWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(platformFeeStr) / 1000 * 12;
        contentStream.newLineAtOffset(550 - platformFeeWidth, y);
        contentStream.showText(platformFeeStr);
        contentStream.endText();

        y -= lineHeight * 1.2;

        // Other deductions if applicable
        BigDecimal otherDeductions = BigDecimal.ZERO;
        if (payment.getOtherDeductions() != null && payment.getOtherDeductions().compareTo(BigDecimal.ZERO) > 0) {
          otherDeductions = payment.getOtherDeductions();

          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
          contentStream.newLineAtOffset(50, y);
          contentStream.showText("Other Deductions:");
          contentStream.endText();

          // Format other deductions with right alignment
          String otherDeductionsStr = "Rs." + otherDeductions.toString();
          contentStream.beginText();
          contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
          float otherDeductionsWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(otherDeductionsStr) / 1000 * 12;
          contentStream.newLineAtOffset(550 - otherDeductionsWidth, y);
          contentStream.showText(otherDeductionsStr);
          contentStream.endText();

          y -= lineHeight;

          if (payment.getDeductionDetails() != null) {
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(70, y);
            contentStream.showText("(" + payment.getDeductionDetails() + ")");
            contentStream.endText();

            y -= lineHeight;
          }
        }

        // Calculate total taxes and fees
        BigDecimal totalTaxesAndFees = gstAmt.add(platformFeeAmt).add(otherDeductions);

        // Add a separator line for tax totals
        contentStream.setLineWidth(0.5f);
        contentStream.moveTo(450, y);
        contentStream.lineTo(550, y);
        contentStream.stroke();
        y -= lineHeight;

        // Total taxes and fees with right alignment
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("TOTAL TAXES & FEES:");
        contentStream.endText();

        String totalTaxesStr = "Rs." + totalTaxesAndFees.toString();
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        float totalTaxesWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(totalTaxesStr) / 1000 * 14;
        contentStream.newLineAtOffset(550 - totalTaxesWidth, y);
        contentStream.showText(totalTaxesStr);
        contentStream.endText();

        y -= lineHeight * 1.5;

        // Add a double separator line for final total
        contentStream.setLineWidth(1f);
        contentStream.moveTo(450, y + 10);
        contentStream.lineTo(550, y + 10);
        contentStream.stroke();
        contentStream.moveTo(450, y + 7);
        contentStream.lineTo(550, y + 7);
        contentStream.stroke();
        y -= lineHeight;

        // Add a background rectangle for the total amount
        contentStream.setNonStrokingColor(230, 230, 230); // Light gray background
        contentStream.addRect(45, y - 5, 510, 25);
        contentStream.fill();
        contentStream.setNonStrokingColor(0, 0, 0); // Reset to black for text

        // Total amount with proper right alignment
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
        contentStream.newLineAtOffset(50, y);
        contentStream.showText("TOTAL AMOUNT:");
        contentStream.endText();

        String totalAmountStr = "Rs." + payment.getTotalAmount().toString();
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
        float totalAmountWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(totalAmountStr) / 1000 * 16;
        contentStream.newLineAtOffset(550 - totalAmountWidth, y);
        contentStream.showText(totalAmountStr);
        contentStream.endText();

        // Footer
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 10);
        contentStream.newLineAtOffset(50, 50);
        contentStream.showText("This is an auto-generated receipt. For any queries, please contact support.");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 10);
        contentStream.newLineAtOffset(50, 30);
        contentStream.showText("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        contentStream.endText();
      } catch (Exception e) {
        System.err.println("Error while creating PDF content: " + e.getMessage());
        e.printStackTrace();
        throw new IOException("Failed to generate PDF content: " + e.getMessage(), e);
      } finally {
        // Always close the content stream
        if (contentStream != null) {
          try {
            contentStream.close();
          } catch (IOException e) {
            System.err.println("Error closing content stream: " + e.getMessage());
          }
        }
      }

      // Save the document AFTER the content stream is closed
      try {
        System.out.println("Saving PDF document to: " + filePath);

        // Make sure the directories exist before saving
        Files.createDirectories(filePath.getParent());

        // Create output stream and close it immediately after use
        try (FileOutputStream outputStream = new FileOutputStream(filePath.toFile())) {
          document.save(outputStream);
        }

        System.out.println("PDF document saved successfully");
      } catch (Exception e) {
        System.err.println("Error saving PDF document: " + e.getMessage());
        e.printStackTrace();
        throw new IOException("Failed to save PDF file: " + e.getMessage(), e);
      }

      // Update payment with receipt URL
      String receiptUrl = receiptsBaseUrl + "/" + filename;
      System.out.println("Receipt URL: " + receiptUrl);

      try {
        payment.setReceiptUrl(receiptUrl);
        paymentRepository.save(payment);
        System.out.println("Payment updated with receipt URL");
      } catch (Exception e) {
        System.err.println("Error updating payment with receipt URL: " + e.getMessage());
        e.printStackTrace();
        // Don't throw here - we've already created the PDF, so return the URL
      }

      // Log the receipt generation
      try {
        auditLogService.logAction(
            AuditLog.EntityType.PAYMENT,
            payment.getId(),
            AuditLog.ActionType.RECEIPT_GENERATED,
            admin,
            null,
            receiptUrl,
            "receiptUrl",
            "Receipt generated for payment #" + payment.getId());
        System.out.println("Receipt generation logged successfully");
      } catch (Exception e) {
        System.err.println("Error logging receipt generation: " + e.getMessage());
        // Don't throw here - we've already created the PDF, so return the URL
      }

      return receiptUrl;
    } catch (Exception e) {
      System.err.println("Error in PDF document creation: " + e.getMessage());
      e.printStackTrace();
      throw new IOException("Failed to create PDF document: " + e.getMessage(), e);
    } finally {
      // Always close the document
      if (document != null) {
        try {
          document.close();
        } catch (IOException e) {
          System.err.println("Error closing document: " + e.getMessage());
        }
      }
    }
  }

  /**
   * Send the receipt to the mentor via email
   */
  public boolean sendReceiptEmail(Payment payment, User admin, String customMessage) throws MessagingException {
    System.out.println("Starting sendReceiptEmail process...");
    User mentor = payment.getMentor();

    // Check if we have a valid email for the mentor
    if (mentor == null) {
      System.err.println("ERROR: Mentor information is missing from the payment");
      throw new MessagingException("Mentor information is missing from the payment");
    }

    if (mentor.getEmail() == null || mentor.getEmail().trim().isEmpty()) {
      System.err.println("ERROR: Mentor email address is missing");
      throw new MessagingException("Mentor email address is missing");
    }

    System.out.println("Sending email to mentor: " + mentor.getEmail());

    // Check if we have a receipt URL
    if (payment.getReceiptUrl() == null) {
      System.err.println("ERROR: Receipt URL is missing");
      throw new MessagingException("Receipt URL is missing. Please generate a receipt first");
    }

    System.out.println("Receipt URL: " + payment.getReceiptUrl());

    // Create a Thymeleaf context for the email template
    Context context = new Context();
    context.setVariable("payment", payment);
    context.setVariable("mentor", mentor);
    context.setVariable("customMessage", customMessage);
    System.out.println("Thymeleaf context created with payment ID: " + payment.getId());

    try {
      // Process the email template
      System.out.println("Attempting to process email template: emails/payment-receipt");
      String emailContent = templateEngine.process("emails/payment-receipt", context);
      if (emailContent == null || emailContent.isEmpty()) {
        System.err.println("WARNING: Processed email content is empty!");
      } else {
        System.out.println("Email content processed successfully, length: " + emailContent.length() + " chars");
      }

      // Create the email message
      System.out.println("Creating email message...");
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true);

      System.out.println("Setting email from: " + fromEmail);
      helper.setFrom(fromEmail);
      System.out.println("Setting email to: " + mentor.getEmail());
      helper.setTo(mentor.getEmail());
      helper.setSubject("Your Payment Receipt from EdTech Payout System");
      helper.setText(emailContent, true);

      // Attach the receipt if possible
      try {
        String localPath = payment.getReceiptUrl().replace(receiptsBaseUrl + "/", "");
        Path receiptPath = Paths.get(receiptsStoragePath, localPath);
        System.out.println("Looking for receipt file at: " + receiptPath);

        if (Files.exists(receiptPath)) {
          System.out.println("Attaching receipt file: " + receiptPath);
          helper.addAttachment("Payment_Receipt_" + payment.getId() + ".pdf", receiptPath.toFile());
        } else {
          System.out.println("Receipt file not found at: " + receiptPath);
        }
      } catch (Exception e) {
        // Log but continue, we'll include the URL in the email as fallback
        System.err.println("Could not attach receipt: " + e.getMessage());
        e.printStackTrace();
      }

      // Send the email
      System.out.println("Attempting to send email via mailSender...");
      System.out.println("Mail sender class: " + mailSender.getClass().getName());
      if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl) {
        org.springframework.mail.javamail.JavaMailSenderImpl impl = (org.springframework.mail.javamail.JavaMailSenderImpl) mailSender;
        System.out.println("SMTP Server: " + impl.getHost() + ":" + impl.getPort());
        System.out.println("Username: " + impl.getUsername());
        System.out.println("Using password: " + (impl.getPassword() != null && !impl.getPassword().isEmpty()));
      }

      mailSender.send(message);
      System.out.println("Email sent successfully!");

      // Update payment receipt sent status
      payment.setReceiptSent(true);
      payment.setReceiptSentAt(LocalDateTime.now());
      paymentRepository.save(payment);
      System.out.println("Payment record updated with receipt sent status");

      // Log the receipt email
      auditLogService.logAction(
          AuditLog.EntityType.PAYMENT,
          payment.getId(),
          AuditLog.ActionType.RECEIPT_SENT,
          admin,
          false,
          true,
          "receiptSent",
          "Receipt sent to " + mentor.getEmail());
      System.out.println("Audit log created for receipt email");

      return true;
    } catch (Exception e) {
      System.err.println("Email sending error: " + e.getMessage());
      if (e.getCause() != null) {
        System.err.println("Caused by: " + e.getCause().getMessage());
      }
      e.printStackTrace();
      throw new MessagingException("Failed to send email: " + e.getMessage(), e);
    }
  }

  /**
   * Calculate payment breakdown (base, taxes, fees)
   */
  public Map<String, BigDecimal> calculatePaymentBreakdown(BigDecimal totalAmount, String gstRate,
      String platformFeeRate) {
    Map<String, BigDecimal> breakdown = new HashMap<>();

    // Default base amount is the full amount
    BigDecimal baseAmount = totalAmount;
    BigDecimal gstAmount = BigDecimal.ZERO;
    BigDecimal platformFee = BigDecimal.ZERO;

    // Calculate GST if applicable
    if (gstRate != null && !gstRate.isEmpty()) {
      // Parse percentage (e.g., "18%" -> 0.18)
      double gstPercentage = Double.parseDouble(gstRate.replace("%", "")) / 100.0;
      gstAmount = totalAmount.multiply(BigDecimal.valueOf(gstPercentage));
      // Adjust base amount
      baseAmount = baseAmount.subtract(gstAmount);
    }

    // Calculate platform fee if applicable
    if (platformFeeRate != null && !platformFeeRate.isEmpty()) {
      // Parse percentage (e.g., "5%" -> 0.05)
      double platformPercentage = Double.parseDouble(platformFeeRate.replace("%", "")) / 100.0;
      platformFee = baseAmount.multiply(BigDecimal.valueOf(platformPercentage));
      // Adjust base amount
      baseAmount = baseAmount.subtract(platformFee);
    }

    breakdown.put("baseAmount", baseAmount);
    breakdown.put("gstAmount", gstAmount);
    breakdown.put("platformFee", platformFee);

    return breakdown;
  }

  /**
   * Run a payment simulation to preview the payout without saving
   */
  public Payment simulatePayment(Payment payment) {
    payment.setIsSimulation(true);

    // Apply tax and fee calculations
    if (payment.getGstRate() != null || payment.getPlatformFeeRate() != null) {
      Map<String, BigDecimal> breakdown = calculatePaymentBreakdown(
          payment.getTotalAmount(),
          payment.getGstRate(),
          payment.getPlatformFeeRate());

      payment.setBaseAmount(breakdown.get("baseAmount"));
      payment.setGstAmount(breakdown.get("gstAmount"));
      payment.setPlatformFee(breakdown.get("platformFee"));
    } else {
      payment.setBaseAmount(payment.getTotalAmount());
    }

    return payment;
  }
}