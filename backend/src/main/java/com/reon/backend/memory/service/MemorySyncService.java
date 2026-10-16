package com.reon.backend.memory.service;

import com.reon.backend.global.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import java.time.*;
import java.util.*;

/** Development-only caller uses the same revision-based pipeline as the production worker. */
@Service
public class MemorySyncService {
    public record SavedMemory(Long id, String title, boolean replayAvailable) {}
    private final MemoryHistoryService history;
    private final MemorySyncCoordinator coordinator;
    private final MemoryService memories;
    private final TransactionTemplate tx;
    public MemorySyncService(MemoryHistoryService history, MemorySyncCoordinator coordinator, MemoryService memories,
                             PlatformTransactionManager manager) {
        this.history = history; this.coordinator = coordinator; this.memories = memories; this.tx = new TransactionTemplate(manager);
    }
    public List<SavedMemory> sync(Long userId, YearMonth month) {
        if (month.getYear() < 1970 || month.getYear() > 9998) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "분석 월 범위가 올바르지 않습니다.");
        }
        tx.executeWithoutResult(s -> history.recordChange(userId, null, month.atDay(1).atStartOfDay().atOffset(ZoneOffset.ofHours(9))));
        // Drain earlier pending months as well, never make an HTTP call inside the write transaction.
        for (int i = 0; i < 120 && coordinator.synchronizeNext(userId); i++) { }
        return memories.list(userId).content().stream().filter(m -> YearMonth.from(m.startDate()).equals(month))
                .map(m -> new SavedMemory(m.id(), m.title(), !memories.replayVideoIds(userId, m.id()).isEmpty())).toList();
    }
}
