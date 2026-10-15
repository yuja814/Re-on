package com.reon.backend.replay.memory;

import java.util.List;
import java.util.Optional;

/** Implement this in the Memory module: return empty for missing or non-owned Memory. */
public interface MemoryPlaylistSource {
    record MemoryMusic(String title, String description, List<String> videoIds) {}
    Optional<MemoryMusic> findOwned(Long memoryId, Long userId);
}
