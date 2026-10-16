package com.reon.backend.replay.repository;

import com.reon.backend.replay.entity.PlaylistExport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PlaylistExportRepository extends JpaRepository<PlaylistExport, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from PlaylistExport e where e.userId = :userId and e.memoryId = :memoryId")
    Optional<PlaylistExport> lockOwned(@org.springframework.data.repository.query.Param("userId") Long userId,
                                      @org.springframework.data.repository.query.Param("memoryId") Long memoryId);
    Optional<PlaylistExport> findByUserIdAndMemoryId(Long userId, Long memoryId);
}
