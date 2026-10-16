package com.reon.backend.auth.repository;

import com.reon.backend.auth.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    long deleteByExpiresAtLessThanEqual(Instant now);
}
