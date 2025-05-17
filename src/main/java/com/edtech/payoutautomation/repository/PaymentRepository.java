package com.edtech.payoutautomation.repository;

import com.edtech.payoutautomation.model.Payment;
import com.edtech.payoutautomation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
  List<Payment> findByMentor(User mentor);

  List<Payment> findByMentorAndStatus(User mentor, Payment.PaymentStatus status);

  @Query("SELECT p FROM Payment p WHERE p.mentor = ?1 AND p.paymentDate BETWEEN ?2 AND ?3")
  List<Payment> findByMentorAndDateRange(User mentor, LocalDateTime startDate, LocalDateTime endDate);
}