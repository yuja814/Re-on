package com.reon.backend.memory;

import com.reon.backend.global.ApiException;
import com.reon.backend.memory.repository.MemoryRepository;
import com.reon.backend.memory.service.*;
import com.reon.backend.moment.entity.Moment;
import com.reon.backend.moment.repository.MomentRepository;
import com.reon.backend.music.dto.MusicResolveResponse;
import com.reon.backend.user.entity.User;
import com.reon.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Transactional
class MemoryIntegrationTests {
    @Autowired MemorySyncService sync;
    @Autowired PersistedMemoryPlaylistSource source;
    @Autowired MemoryRepository memories;
    @Autowired MomentRepository moments;
    @Autowired UserRepository users;
    @MockitoBean MemoryEngineClient engine;
    private User owner;
    private Long otherId, momentId;
    private static final YearMonth MONTH = YearMonth.of(2026,10);
    private static final String ENGINE_ID = "mem_0123456789abcdef";
    private final JsonMapper json = JsonMapper.builder().build();
    @BeforeEach void setup() {
        owner = users.saveAndFlush(new User("memory-owner", "이름", "owner@example.com", null));
        otherId = users.saveAndFlush(new User("memory-other", "다른 사용자", "other@example.com", null)).getId();
        momentId = moments.saveAndFlush(new Moment(owner, new MusicResolveResponse("wJhWwt1OmT8", "Live Forever", "Oasis - Topic", null),
                "기록", Instant.parse("2026-10-01T00:00:00Z"), null, null)).getId();
        when(engine.analyze(any())).thenReturn(response(owner.getId(), "wJhWwt1OmT8", false));
    }
    private JsonNode response(Long userId, String track, boolean deactivate) {
        var body = new LinkedHashMap<String,Object>();
        body.put("scope", Map.of("user_id", userId.toString(), "months", List.of("2026-10"), "complete_month_history", true, "history_revision", 0));
        body.put("memories", deactivate ? List.of() : List.of(Map.of(
                "memory_id", ENGINE_ID, "user_id", userId.toString(), "period", Map.of("month","2026-10"),
                "content_hash", "a".repeat(64), "title", "Oasis와 함께한 10월", "description", "설명",
                "moment_ids", List.of(momentId.toString()), "tracks", List.of(Map.of("track_id",track)), "replay_available",true)));
        body.put("deactivated_memory_ids", deactivate ? List.of(ENGINE_ID) : List.of());
        return json.valueToTree(body);
    }
    @Test void persistsMemoryWithStableNumericIdAndProvidesPlaylistTracks() {
        var first = sync.sync(owner.getId(), MONTH);
        var second = sync.sync(owner.getId(), MONTH);
        assertEquals(1, first.size()); assertEquals(first.getFirst().id(), second.getFirst().id());
        var playlist = source.findOwned(first.getFirst().id(), owner.getId()).orElseThrow();
        assertEquals(List.of("wJhWwt1OmT8"), playlist.videoIds());
        assertEquals("Oasis와 함께한 10월", playlist.title());
    }
    @Test void hidesOtherUsersMemoryBeforeCallingEngine() {
        Long id = sync.sync(owner.getId(), MONTH).getFirst().id();
        clearInvocations(engine);
        assertTrue(source.findOwned(id, otherId).isEmpty());
        verifyNoInteractions(engine);
    }
    @Test void deactivatesRemovedPatternAndExcludesItFromReplay() {
        Long id = sync.sync(owner.getId(), MONTH).getFirst().id();
        moments.deleteById(momentId); moments.flush();
        when(engine.analyze(any())).thenReturn(response(owner.getId(), "wJhWwt1OmT8", true));
        assertTrue(sync.sync(owner.getId(), MONTH).isEmpty());
        assertFalse(memories.findById(id).orElseThrow().isActive());
        assertTrue(source.findOwned(id, owner.getId()).isEmpty());
    }
    @Test void rejectsForeignOwnerInEngineResponse() {
        when(engine.analyze(any())).thenReturn(response(otherId, "wJhWwt1OmT8", false));
        assertEquals("INVALID_MEMORY_ENGINE_RESPONSE", assertThrows(ApiException.class, () -> sync.sync(owner.getId(), MONTH)).code());
    }
    @Test void rejectsTracksNotInOwnedMomentHistory() {
        when(engine.analyze(any())).thenReturn(response(owner.getId(), "abcdefghijk", false));
        assertThrows(ApiException.class, () -> sync.sync(owner.getId(), MONTH));
    }
    @Test void sendsCompleteOwnedMonthAndExistingSnapshotsToEngine() {
        sync.sync(owner.getId(), MONTH);
        var argument = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(engine).analyze(argument.capture());
        JsonNode request = json.valueToTree(argument.getValue());
        assertEquals(owner.getId().toString(), request.get("userId").asText());
        assertEquals(1, request.get("moments").size());
        assertTrue(request.get("scope").get("complete_month_history").asBoolean());
        assertEquals("2026-10", request.get("scope").get("months").get(0).asText());
        assertEquals("wJhWwt1OmT8", request.get("moments").get(0).get("music").get("videoId").asText());
    }
}
