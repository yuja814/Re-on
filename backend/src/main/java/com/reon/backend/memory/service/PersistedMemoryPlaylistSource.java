package com.reon.backend.memory.service;

import com.reon.backend.replay.memory.MemoryPlaylistSource;
import com.reon.backend.memory.repository.MemoryRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Component
public class PersistedMemoryPlaylistSource implements MemoryPlaylistSource {
    private final MemoryRepository repository;
    private final MemoryService memories;
    public PersistedMemoryPlaylistSource(MemoryRepository repository, MemoryService memories) {
        this.repository = repository; this.memories = memories;
    }
    @Transactional(readOnly = true)
    public Optional<MemoryMusic> findOwned(Long memoryId, Long userId) {
        return repository.findByIdAndUserIdAndActiveTrue(memoryId, userId)
                .map(m -> new MemoryMusic(m.getTitle(), m.getDescription(), memories.replayVideoIds(userId, memoryId)));
    }
}
