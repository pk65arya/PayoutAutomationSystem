package com.edtech.payoutautomation.controller;

import com.edtech.payoutautomation.model.AuditLog;
import com.edtech.payoutautomation.model.ERole;
import com.edtech.payoutautomation.model.Message;
import com.edtech.payoutautomation.model.Role;
import com.edtech.payoutautomation.model.User;
import com.edtech.payoutautomation.repository.AuditLogRepository;
import com.edtech.payoutautomation.repository.MessageRepository;
import com.edtech.payoutautomation.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

  @Autowired
  private MessageRepository messageRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AuditLogRepository auditLogRepository;

  @GetMapping("/diagnosis")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Map<String, Object>> getDiagnosisInfo() {
    Map<String, Object> diagnosisInfo = new HashMap<>();
    User currentUser = getCurrentUser();

    try {
      // Get basic user info
      Map<String, Object> userInfo = new HashMap<>();
      userInfo.put("id", currentUser.getId());
      userInfo.put("username", currentUser.getUsername());
      userInfo.put("roles", getUserRolesAsString());
      userInfo.put("isAdmin", hasAdminRole(currentUser));
      userInfo.put("isMentor", hasMentorRole(currentUser));
      diagnosisInfo.put("currentUser", userInfo);

      // Get conversations
      List<Long> userIds = messageRepository.findUserConversations(currentUser.getId());
      diagnosisInfo.put("conversationIds", userIds);

      // Get admin users
      List<User> allUsers = userRepository.findAll();
      List<Map<String, Object>> adminUsers = allUsers.stream()
          .filter(this::hasAdminRole)
          .map(user -> {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
            return userMap;
          })
          .collect(Collectors.toList());
      diagnosisInfo.put("availableAdmins", adminUsers);

      // Get mentor users
      List<Map<String, Object>> mentorUsers = allUsers.stream()
          .filter(this::hasMentorRole)
          .map(user -> {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
            return userMap;
          })
          .collect(Collectors.toList());
      diagnosisInfo.put("availableMentors", mentorUsers);

      // Count messages from/to current user
      long sentCount = messageRepository.countBySenderId(currentUser.getId());
      long receivedCount = messageRepository.countByRecipientId(currentUser.getId());
      Map<String, Object> messageStats = new HashMap<>();
      messageStats.put("sentCount", sentCount);
      messageStats.put("receivedCount", receivedCount);
      diagnosisInfo.put("messageStats", messageStats);

      // Check if there's message flow between admin and mentor
      boolean hasAdminMentorFlow = false;
      if (hasMentorRole(currentUser)) {
        // Check if mentor can see admins
        hasAdminMentorFlow = !adminUsers.isEmpty();
      } else if (hasAdminRole(currentUser)) {
        // Check if admin can see mentors
        hasAdminMentorFlow = !mentorUsers.isEmpty();
      }
      diagnosisInfo.put("hasAdminMentorFlow", hasAdminMentorFlow);

      return ResponseEntity.ok(diagnosisInfo);
    } catch (Exception e) {
      diagnosisInfo.put("error", e.getMessage());
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(diagnosisInfo);
    }
  }

  @GetMapping("/conversations")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<List<Map<String, Object>>> getConversations() {
    try {
      User currentUser = getCurrentUser();
      System.out.println("==== Getting conversations for " + currentUser.getUsername() + " ====");

      // Get all users that the current user has exchanged messages with
      List<Long> userIds = messageRepository.findUserConversations(currentUser.getId());
      System.out.println("Found " + userIds.size() + " conversations");

      List<Map<String, Object>> conversations = new ArrayList<>();

      for (Long userId : userIds) {
        User otherUser = userRepository.findById(userId).orElse(null);
        if (otherUser == null) {
          System.out.println("Warning: User with ID " + userId + " not found, skipping conversation");
          continue;
        }

        // Get the last message exchanged between these users
        List<Message> messages = messageRepository.findConversation(currentUser, otherUser);
        Message lastMessage = messages.isEmpty() ? null : messages.get(messages.size() - 1);

        Map<String, Object> conversation = new HashMap<>();
        conversation.put("id", otherUser.getId());
        conversation.put("username", otherUser.getUsername());
        conversation.put("fullName", otherUser.getFullName());

        // Add participant info as expected by frontend
        List<Map<String, Object>> participants = new ArrayList<>();

        // Add current user
        Map<String, Object> currentUserMap = new HashMap<>();
        currentUserMap.put("id", currentUser.getId());
        currentUserMap.put("username", currentUser.getUsername());
        currentUserMap.put("fullName", currentUser.getFullName());
        participants.add(currentUserMap);

        // Add other user
        Map<String, Object> otherUserMap = new HashMap<>();
        otherUserMap.put("id", otherUser.getId());
        otherUserMap.put("username", otherUser.getUsername());
        otherUserMap.put("fullName", otherUser.getFullName());
        participants.add(otherUserMap);

        conversation.put("participants", participants);

        // Add last message info if available
        if (lastMessage != null) {
          conversation.put("lastMessage", lastMessage.getContent());
          conversation.put("lastMessageTime", lastMessage.getSentAt());

          // Count unread messages
          long unreadCount = messages.stream()
              .filter(m -> m.getRecipient().getId().equals(currentUser.getId()) && !m.isRead())
              .count();
          conversation.put("unreadCount", unreadCount);
        } else {
          conversation.put("lastMessage", "");
          conversation.put("lastMessageTime", null);
          conversation.put("unreadCount", 0);
        }

        conversations.add(conversation);
      }

      System.out.println("Returning " + conversations.size() + " conversations");
      return ResponseEntity.ok(conversations);
    } catch (Exception e) {
      System.err.println("Error getting conversations: " + e.getMessage());
      e.printStackTrace();
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Failed to get conversations: " + e.getMessage());
    }
  }

  @GetMapping("/conversation/{userId}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<List<Message>> getConversation(@PathVariable Long userId) {
    try {
      User currentUser = getCurrentUser();
      System.out.println(
          "==== Getting conversation between " + currentUser.getUsername() + " and user ID: " + userId + " ====");

      User otherUser = userRepository.findById(userId)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

      System.out.println("Other user found: " + otherUser.getUsername());

      List<Message> messages = messageRepository.findConversation(currentUser, otherUser);
      System.out.println("Found " + messages.size() + " messages in conversation");

      // Mark messages as read if current user is the recipient
      int unreadCount = 0;
      for (Message message : messages) {
        if (message.getRecipient().getId().equals(currentUser.getId()) && !message.isRead()) {
          message.setRead(true);
          message.setReadAt(LocalDateTime.now());
          messageRepository.save(message);
          unreadCount++;
        }
      }

      if (unreadCount > 0) {
        System.out.println("Marked " + unreadCount + " messages as read");
      }

      return ResponseEntity.ok(messages);
    } catch (Exception e) {
      System.err.println("Error getting conversation: " + e.getMessage());
      e.printStackTrace();
      throw e;
    }
  }

  @GetMapping("/unread")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<List<Message>> getUnreadMessages() {
    User currentUser = getCurrentUser();
    System.out.println("==== Getting unread messages for " + currentUser.getUsername() + " ====");

    try {
      List<Message> unreadMessages = messageRepository.findByRecipientAndIsRead(currentUser, false);
      System.out.println("Found " + unreadMessages.size() + " unread messages");
      return ResponseEntity.ok(unreadMessages);
    } catch (Exception e) {
      System.err.println("Error getting unread messages: " + e.getMessage());
      e.printStackTrace();
      throw e;
    }
  }

  @PostMapping
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Message> sendMessage(@Valid @RequestBody Message message, HttpServletRequest request) {
    try {
      User currentUser = getCurrentUser();
      System.out.println("==== Sending message from " + currentUser.getUsername() + " (ID: " + currentUser.getId()
          + ", Roles: " + getUserRolesAsString() + ") ====");

      if (message == null) {
        System.err.println("ERROR: Message is null");
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be null");
      }

      if (message.getRecipient() == null || message.getRecipient().getId() == null) {
        System.err.println("ERROR: Recipient is missing or has null ID");
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient information is required");
      }

      System.out.println("Recipient ID: " + message.getRecipient().getId());
      System.out.println("Message content: " + message.getContent());

      User recipient = userRepository.findById(message.getRecipient().getId())
          .orElseThrow(() -> {
            System.err.println("ERROR: Recipient not found with ID: " + message.getRecipient().getId());
            return new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Recipient not found with ID: " + message.getRecipient().getId());
          });

      System.out.println("Recipient found: " + recipient.getUsername() + " (ID: " + recipient.getId() + ")");

      // Set message properties
      message.setSender(currentUser);
      message.setRecipient(recipient);
      message.setSentAt(LocalDateTime.now());
      message.setRead(false);

      System.out.println("Saving message from " + currentUser.getUsername() + " to " + recipient.getUsername());
      System.out.println("Message content: " + message.getContent());

      Message savedMessage = messageRepository.save(message);
      System.out.println("Message saved successfully with ID: " + savedMessage.getId());

      // Create audit log
      createAuditLog("CREATE", "Sent message ID: " + savedMessage.getId() + " to " + recipient.getUsername(),
          AuditLog.EntityType.MESSAGE, savedMessage.getId(), request);

      return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
    } catch (Exception e) {
      System.err.println("ERROR sending message: " + e.getMessage());
      e.printStackTrace();

      if (e instanceof ResponseStatusException) {
        throw e;
      }

      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Failed to send message: " + e.getMessage());
    }
  }

  @PutMapping("/{id}/read")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Message> markMessageAsRead(@PathVariable Long id, HttpServletRequest request) {
    try {
      User currentUser = getCurrentUser();
      System.out.println("==== Marking message " + id + " as read for " + currentUser.getUsername() + " ====");

      Message message = messageRepository.findById(id)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found with ID: " + id));

      // Check if the current user is the recipient
      if (!message.getRecipient().getId().equals(currentUser.getId())) {
        System.err.println("User " + currentUser.getUsername() + " attempted to mark message " + id +
            " as read but is not the recipient. Actual recipient: " + message.getRecipient().getUsername());
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to mark this message as read");
      }

      message.setRead(true);
      message.setReadAt(LocalDateTime.now());

      Message updatedMessage = messageRepository.save(message);
      System.out.println("Message marked as read successfully");

      // Create audit log
      createAuditLog("UPDATE", "Marked message ID: " + id + " as read",
          AuditLog.EntityType.MESSAGE, id, request);

      return ResponseEntity.ok(updatedMessage);
    } catch (Exception e) {
      System.err.println("Error marking message as read: " + e.getMessage());
      e.printStackTrace();
      throw e;
    }
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Void> deleteMessage(@PathVariable Long id, HttpServletRequest request) {
    try {
      User currentUser = getCurrentUser();
      System.out.println("==== Deleting message " + id + " by " + currentUser.getUsername() + " ====");

      Message message = messageRepository.findById(id)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found with ID: " + id));

      // Check if the current user is either the sender or recipient
      if (!message.getSender().getId().equals(currentUser.getId()) &&
          !message.getRecipient().getId().equals(currentUser.getId())) {
        System.err.println("User " + currentUser.getUsername() + " attempted to delete message " + id +
            " but is neither sender nor recipient. Sender: " + message.getSender().getUsername() +
            ", Recipient: " + message.getRecipient().getUsername());
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to delete this message");
      }

      messageRepository.delete(message);
      System.out.println("Message deleted successfully");

      // Create audit log
      createAuditLog("DELETE", "Deleted message ID: " + id,
          AuditLog.EntityType.MESSAGE, id, request);

      return ResponseEntity.noContent().build();
    } catch (Exception e) {
      System.err.println("Error deleting message: " + e.getMessage());
      e.printStackTrace();
      throw e;
    }
  }

  @GetMapping("/debug")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Map<String, Object>> getDebugInfo() {
    Map<String, Object> debugInfo = new HashMap<>();
    try {
      User currentUser = getCurrentUser();
      debugInfo.put("currentUser", Map.of(
          "id", currentUser.getId(),
          "username", currentUser.getUsername(),
          "roles", getUserRolesAsString(),
          "isAdmin", hasAdminRole(currentUser),
          "isMentor", hasMentorRole(currentUser)));

      // Check conversations
      List<Long> conversationUserIds = messageRepository.findUserConversations(currentUser.getId());
      debugInfo.put("conversationCount", conversationUserIds.size());
      debugInfo.put("conversationUserIds", conversationUserIds);

      List<Map<String, Object>> conversationDetails = new ArrayList<>();
      for (Long userId : conversationUserIds) {
        userRepository.findById(userId).ifPresent(user -> {
          Map<String, Object> userMap = new HashMap<>();
          userMap.put("id", user.getId());
          userMap.put("username", user.getUsername());
          userMap.put("isAdmin", hasAdminRole(user));
          userMap.put("isMentor", hasMentorRole(user));

          List<Message> messages = messageRepository.findConversation(currentUser, user);
          userMap.put("messageCount", messages.size());

          conversationDetails.add(userMap);
        });
      }
      debugInfo.put("conversations", conversationDetails);

      // Check sent/received counts
      long sentCount = messageRepository.countBySenderId(currentUser.getId());
      long receivedCount = messageRepository.countByRecipientId(currentUser.getId());
      debugInfo.put("messageStats", Map.of(
          "sentCount", sentCount,
          "receivedCount", receivedCount));

      // Check permissions
      debugInfo.put("permissions", Map.of(
          "canSendMessages", true,
          "authorities", SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
              .map(Object::toString).collect(Collectors.toList())));

      return ResponseEntity.ok(debugInfo);
    } catch (Exception e) {
      debugInfo.put("error", e.getMessage());
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(debugInfo);
    }
  }

  @PostMapping("/test-message")
  @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MENTOR')")
  public ResponseEntity<Map<String, Object>> sendTestMessage(
      @RequestParam(required = false) Long recipientId,
      HttpServletRequest request) {

    Map<String, Object> result = new HashMap<>();

    try {
      User currentUser = getCurrentUser();
      System.out.println("==== Sending TEST message from " + currentUser.getUsername() + " ====");

      // Find recipient - if not specified, find first admin or mentor (other than
      // current user)
      User recipient;
      if (recipientId != null) {
        recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Recipient not found with ID: " + recipientId));
      } else {
        // Find another user (admin or mentor)
        List<User> potentialRecipients = userRepository.findAll().stream()
            .filter(u -> !u.getId().equals(currentUser.getId()))
            .filter(u -> hasAdminRole(u) || hasMentorRole(u))
            .limit(1)
            .collect(Collectors.toList());

        if (potentialRecipients.isEmpty()) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "No potential recipients found. Please create another admin or mentor account.");
        }

        recipient = potentialRecipients.get(0);
      }

      // Create test message
      Message message = new Message();
      message.setSender(currentUser);
      message.setRecipient(recipient);
      message.setContent("Test message sent at " + LocalDateTime.now());
      message.setSentAt(LocalDateTime.now());
      message.setRead(false);

      // Save message
      Message savedMessage = messageRepository.save(message);

      // Create audit log
      createAuditLog("CREATE", "Sent TEST message ID: " + savedMessage.getId() + " to " + recipient.getUsername(),
          AuditLog.EntityType.MESSAGE, savedMessage.getId(), request);

      // Return success message with details
      result.put("success", true);
      result.put("message", "Test message sent successfully");
      result.put("messageId", savedMessage.getId());
      result.put("sender", Map.of(
          "id", currentUser.getId(),
          "username", currentUser.getUsername()));
      result.put("recipient", Map.of(
          "id", recipient.getId(),
          "username", recipient.getUsername()));

      return ResponseEntity.ok(result);
    } catch (Exception e) {
      System.err.println("ERROR sending test message: " + e.getMessage());
      e.printStackTrace();

      result.put("success", false);
      result.put("error", e.getMessage());

      return ResponseEntity.status(
          (e instanceof ResponseStatusException) ? ((ResponseStatusException) e).getStatusCode()
              : HttpStatus.INTERNAL_SERVER_ERROR)
          .body(result);
    }
  }

  // Helper methods
  private String getUserRolesAsString() {
    return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
        .map(Object::toString)
        .collect(Collectors.joining(", "));
  }

  private boolean hasAdminRole(User user) {
    return user.getRoles().stream()
        .anyMatch(role -> {
          if (role instanceof Role) {
            return ((Role) role).getName().equals(ERole.ROLE_ADMIN);
          } else {
            String roleStr = role.toString();
            return roleStr.contains("ADMIN") || roleStr.contains("ROLE_ADMIN");
          }
        });
  }

  private boolean hasMentorRole(User user) {
    return user.getRoles().stream()
        .anyMatch(role -> {
          if (role instanceof Role) {
            return ((Role) role).getName().equals(ERole.ROLE_MENTOR);
          } else {
            String roleStr = role.toString();
            return roleStr.contains("MENTOR") || roleStr.contains("ROLE_MENTOR");
          }
        });
  }

  private User getCurrentUser() {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserDetails) {
      String username = ((UserDetails) principal).getUsername();
      return userRepository.findByUsername(username)
          .orElseThrow(
              () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with username: " + username));
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
    System.out.println("Created audit log: " + action + " - " + details);
  }
}