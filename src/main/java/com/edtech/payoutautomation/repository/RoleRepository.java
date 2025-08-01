package com.edtech.payoutautomation.repository;

import com.edtech.payoutautomation.model.ERole;
import com.edtech.payoutautomation.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
  Optional<Role> findByName(ERole name);
}