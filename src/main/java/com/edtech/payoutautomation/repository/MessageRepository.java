package com.edtech.payoutautomation.repository;

import com.edtech.payoutautomation.model.Message;
import com.edtech.payoutautomation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
  @Query("SELECT m FROM Message m WHERE (m.sender = ?1 AND m.recipient = ?2) OR (m.sender = ?2 AND m.recipient = ?1) ORDER BY m.sentAt ASC")
  List<Message> findConversation(User user1, User user2);

  List<Message> findBySenderAndRecipientOrderBySentAtAsc(User sender, User recipient);

  List<Message> findByRecipientAndIsRead(User recipient, boolean isRead);

  @Query(value = "SELECT DISTINCT CASE WHEN m.sender_id = ?1 THEN m.recipient_id ELSE m.sender_id END AS user_id " +
      "FROM messages m " +
      "WHERE m.sender_id = ?1 OR m.recipient_id = ?1 " +
      "ORDER BY user_id", nativeQuery = true)
  List<Long> findUserConversations(Long userId);

  // Count methods for statistics
  @Query(value = "SELECT COUNT(*) FROM messages WHERE sender_id = ?1", nativeQuery = true)
  long countBySenderId(Long senderId);

  @Query(value = "SELECT COUNT(*) FROM messages WHERE recipient_id = ?1", nativeQuery = true)
  long countByRecipientId(Long recipientId);
}