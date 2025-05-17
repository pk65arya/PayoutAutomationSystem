package com.edtech.payoutautomation.repository;

import com.edtech.payoutautomation.model.Session;
import com.edtech.payoutautomation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
  List<Session> findByMentor(User mentor);

  List<Session> findByMentorAndStatus(User mentor, Session.SessionStatus status);

  @Query("SELECT s FROM Session s WHERE s.mentor = ?1 AND s.recordedDate BETWEEN ?2 AND ?3")
  List<Session> findByMentorAndDateRange(User mentor, LocalDate startDate, LocalDate endDate);

  @Query("SELECT s FROM Session s WHERE s.status = ?1 AND s.recordedDate BETWEEN ?2 AND ?3")
  List<Session> findByStatusAndDateRange(Session.SessionStatus status, LocalDate startDate, LocalDate endDate);
}