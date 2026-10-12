package com.reon.backend.replay.repository;

import com.reon.backend.replay.entity.PlaylistExport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PlaylistExportRepository extends JpaRepository<PlaylistExport, Long> {
    Optional<PlaylistExport> findByUserIdAndMemoryId(Long userId, Long memoryId);
}
