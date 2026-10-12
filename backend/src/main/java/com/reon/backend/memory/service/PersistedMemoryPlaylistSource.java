package com.reon.backend.memory.service;

import com.reon.backend.memory.repository.MemoryRepository;
import com.reon.backend.replay.memory.MemoryPlaylistSource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import java.time.YearMonth;
import java.util.*;

@Component
public class PersistedMemoryPlaylistSource implements MemoryPlaylistSource {
    private final MemoryRepository memories;
    private final MemorySyncService sync;
    private final JsonMapper json = JsonMapper.builder().build();
    public PersistedMemoryPlaylistSource(MemoryRepository memories, MemorySyncService sync) { this.memories = memories; this.sync = sync; }
    public Optional<MemoryMusic> findOwned(Long memoryId, Long userId) {
        var existing = memories.findByIdAndUserId(memoryId, userId);
        if (existing.isEmpty()) { return Optional.empty(); }
        sync.sync(userId, YearMonth.parse(existing.get().getPeriodMonth()));
        return memories.findByIdAndUserId(memoryId, userId).filter(m -> m.isActive()).map(memory -> {
            var row = json.readTree(memory.getSnapshot());
            var tracks = new ArrayList<String>();
            for (var track : row.path("tracks")) { tracks.add(track.path("track_id").asText()); }
            return new MemoryMusic(row.path("title").asText(), row.path("description").asText(), tracks);
        });
    }
}
