package com.reon.backend.youtube.repository;

import com.reon.backend.youtube.entity.YouTubeConnection;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface YouTubeConnectionRepository extends JpaRepository<YouTubeConnection, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from YouTubeConnection c where c.userId = :id")
    Optional<YouTubeConnection> lockByUserId(@Param("id") Long id);
}
