package com.reon.backend.youtube.repository;

import com.reon.backend.youtube.entity.YouTubeAuthorization;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface YouTubeAuthorizationRepository extends JpaRepository<YouTubeAuthorization, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from YouTubeAuthorization a where a.userId = :id")
    Optional<YouTubeAuthorization> lockByUserId(@Param("id") Long id);
}
