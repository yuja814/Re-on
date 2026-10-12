package com.reon.backend.memory.service;

import com.reon.backend.global.ApiException;
import com.reon.backend.memory.entity.Memory;
import com.reon.backend.memory.repository.MemoryRepository;
import com.reon.backend.moment.entity.Moment;
import com.reon.backend.moment.repository.MomentRepository;
import com.reon.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;

@Service
public class MemorySyncService {
    public record SavedMemory(Long id, String title, boolean replayAvailable) {}
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final UserRepository users;
    private final MomentRepository moments;
    private final MemoryRepository memories;
    private final MemoryEngineClient engine;
    private final JsonMapper json = JsonMapper.builder().build();
    public MemorySyncService(UserRepository users, MomentRepository moments, MemoryRepository memories, MemoryEngineClient engine) {
        this.users = users; this.moments = moments; this.memories = memories; this.engine = engine;
    }

    // Serializes a complete monthly snapshot and its application with Moment writes.
    // The engine only echoes revision; holding the same owner lock makes stale application impossible here.
    @Transactional
    public List<SavedMemory> sync(Long userId, YearMonth month) {
        if (month.getYear() < 1970 || month.getYear() > 9998) { throw invalid(); }
        users.lockById(userId).orElseThrow();
        var history = moments.findByUserIdAndRecordedAtGreaterThanEqualAndRecordedAtLessThanOrderByRecordedAtAscIdAsc(userId,
                month.atDay(1).atStartOfDay(ZONE).toInstant(), month.plusMonths(1).atDay(1).atStartOfDay(ZONE).toInstant());
        var stored = memories.findByUserIdAndPeriodMonthOrderByIdAsc(userId, month.toString());
        if (history.size() > 1000 || stored.size() > 1000) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "MEMORY_HISTORY_TOO_LARGE", "월별 전체 기록이 Memory 엔진 한도를 초과했습니다.");
        }
        var snapshots = stored.stream().map(m -> Map.of("memory_id", m.getEngineId(), "user_id", userId.toString(),
                "period_month", month.toString(), "content_hash", m.getContentHash(), "is_active", m.isActive())).toList();
        var request = Map.of("userId", userId.toString(), "moments", history.stream().map(this::toEngine).toList(),
                "existing_memories", snapshots, "scope", Map.of("user_id", userId.toString(), "months", List.of(month.toString()),
                "complete_month_history", true, "history_revision", 0));
        var result = engine.analyze(request);
        var scope = result.path("scope");
        if (!userId.toString().equals(scope.path("user_id").asText()) || !scope.path("complete_month_history").asBoolean()
                || scope.path("history_revision").asLong(-1) != 0 || scope.path("months").size() != 1
                || !month.toString().equals(scope.path("months").path(0).asText())
                || !result.path("memories").isArray() || result.path("memories").size() > 3
                || !result.path("deactivated_memory_ids").isArray()) { throw invalid(); }
        Set<String> ownedMoments = new HashSet<>(), ownedTracks = new HashSet<>();
        for (var moment : history) { ownedMoments.add(moment.getId().toString()); ownedTracks.add(moment.getVideoId()); }
        Set<String> seen = new HashSet<>();
        for (var row : result.path("memories")) {
            String engineId = row.path("memory_id").asText();
            if (!engineId.matches("mem_[a-f0-9]{16}") || !seen.add(engineId)
                    || !userId.toString().equals(row.path("user_id").asText())
                    || !month.toString().equals(row.path("period").path("month").asText())
                    || !row.path("content_hash").asText().matches("[a-f0-9]{64}")
                    || row.path("title").asText().isBlank() || !row.path("tracks").isArray()
                    || !row.path("moment_ids").isArray()) { throw invalid(); }
            for (var id : row.path("moment_ids")) { if (!ownedMoments.contains(id.asText())) { throw invalid(); } }
            for (var track : row.path("tracks")) {
                String videoId = track.path("track_id").asText();
                if (!videoId.matches("[A-Za-z0-9_-]{11}") || !ownedTracks.contains(videoId)) { throw invalid(); }
            }
            var memory = stored.stream().filter(m -> m.getEngineId().equals(engineId)).findFirst()
                    .orElseGet(() -> new Memory(userId, engineId, month.toString()));
            memory.apply(row.path("content_hash").asText(), row.toString()); memories.saveAndFlush(memory);
        }
        for (var id : result.path("deactivated_memory_ids")) {
            var memory = stored.stream().filter(m -> m.getEngineId().equals(id.asText())).findFirst().orElseThrow(this::invalid);
            if (seen.contains(memory.getEngineId())) { throw invalid(); }
            memory.deactivate();
        }
        memories.flush();
        return memories.findByUserIdAndPeriodMonthOrderByIdAsc(userId, month.toString()).stream().filter(Memory::isActive)
                .map(m -> { var row = json.readTree(m.getSnapshot()); return new SavedMemory(m.getId(), row.path("title").asText(), row.path("replay_available").asBoolean()); }).toList();
    }

    private Map<String, Object> toEngine(Moment moment) {
        var music = new LinkedHashMap<String, Object>();
        music.put("videoId", moment.getVideoId()); music.put("title", moment.getTitle());
        music.put("channelTitle", moment.getChannelTitle()); music.put("thumbnailUrl", moment.getThumbnailUrl());
        var row = new LinkedHashMap<String, Object>();
        row.put("momentId", moment.getId().toString()); row.put("recordedAt", moment.getRecordedAt().toString());
        row.put("music", music); row.put("memo", moment.getMemo());
        // Coordinates are not place names. Do not invent geocoded location labels.
        row.put("location", null); return row;
    }
    private ApiException invalid() { return new ApiException(HttpStatus.BAD_GATEWAY, "INVALID_MEMORY_ENGINE_RESPONSE", "Memory 분석 결과의 사용자·월·곡 정보를 확인하지 못했습니다."); }
}
