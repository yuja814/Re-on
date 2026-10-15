package com.reon.backend.memory;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.auth.repository.AuthSessionRepository;
import com.reon.backend.memory.engine.MemoryEngineClient;
import com.reon.backend.memory.engine.EngineContract.*;
import com.reon.backend.memory.engine.EngineContract.Period;
import com.reon.backend.memory.repository.*;
import com.reon.backend.memory.service.*;
import com.reon.backend.moment.repository.MomentRepository;
import com.reon.backend.moment.service.MomentService;
import com.reon.backend.moment.dto.*;
import com.reon.backend.music.service.YouTubeClient;
import com.reon.backend.music.dto.MusicResolveResponse;
import com.reon.backend.user.repository.UserRepository;
import com.reon.backend.user.entity.User;
import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class MemoryIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired SessionService sessions;
    @Autowired AuthSessionRepository auth;
    @Autowired UserRepository users;
    @Autowired MomentService moments;
    @Autowired MomentRepository momentRows;
    @Autowired MemoryRepository memories;
    @Autowired MemoryHistoryRevisionRepository revisions;
    @Autowired MemorySyncCoordinator coordinator;
    @Autowired MemorySnapshotService snapshots;
    @Autowired MemoryResultService results;
    @Autowired MemoryService service;
    @Autowired PersistedMemoryPlaylistSource playlists;
    @MockitoBean MemoryEngineClient engine;
    @MockitoBean YouTubeClient youtube;
    Long ownerId;
    String owner, other;
    List<Long> ids;
    final JsonMapper json = JsonMapper.builder().build();
    @BeforeEach void setup() {
        var user = users.saveAndFlush(new User("integrated-owner", "이름", "owner@example.com", null));
        ownerId = user.getId(); owner = "Bearer " + sessions.issue(user);
        other = "Bearer " + sessions.issue(users.saveAndFlush(new User("integrated-other", "다른 사용자", "other@example.com", null)));
        when(youtube.findVideo(anyString())).thenReturn(new MusicResolveResponse("wJhWwt1OmT8", "Live Forever", "Oasis - Topic", null));
        ids = new ArrayList<>();
        for(int day=1; day<=3; day++) ids.add(moments.create(owner, new MomentCreateRequest("wJhWwt1OmT8", "공연 메모",
                OffsetDateTime.of(2026,10,day,19,0,0,0,ZoneOffset.ofHours(9)), new LocationDto(37.45,127.128))).id());
        when(engine.analyze(any())).thenAnswer(call -> {
            assertFalse(TransactionSynchronizationManager.isActualTransactionActive(), "HTTP must run outside DB transactions");
            return response(call.getArgument(0));
        });
    }
    @AfterEach void cleanup() {
        memories.deleteAll(); revisions.deleteAll(); momentRows.deleteAll(); auth.deleteAll(); users.deleteAll();
    }
    Response response(Request request) {
        var rows = request.moments();
        if (rows.isEmpty()) return new Response(null,List.of(),request.scope(),request.existing_memories().stream().filter(Existing::is_active).map(Existing::memory_id).toList());
        var dates = rows.stream().map(m -> OffsetDateTime.parse(m.recordedAt()).withOffsetSameInstant(ZoneOffset.ofHours(9)).toLocalDate()).sorted().toList();
        var context = json.createObjectNode().put("count", rows.size()).put("dominant_time_band","EVENING").put("dominant_time_ratio",1.0);
        var result = new Result("mem_0123456789abcdef", request.userId(), "ARTIST", "Oasis와 함께한 10월", "음악 기록",
                new Period("2026-10",dates.getFirst().toString(),dates.getLast().toString()), rows.stream().map(m -> Long.toString(m.id())).toList(),
                List.of(new Track("wJhWwt1OmT8",null,"Live Forever")),true,context,"a".repeat(64),"CREATE");
        return new Response(null,List.of(result),request.scope(),List.of());
    }
    long analyze() { assertTrue(coordinator.synchronizeNext(ownerId)); return service.list(ownerId).content().getFirst().id(); }
    @Test void bearerLoginExposesOnlyOwnedMemoryAndReadIsIdempotent() throws Exception {
        long id=analyze();
        mvc.perform(get("/api/v1/memories").header("Authorization",owner)).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id));
        mvc.perform(get("/api/v1/memories/"+id).header("Authorization",other)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/memories")).andExpect(status().isUnauthorized());
        for(int i=0;i<2;i++) mvc.perform(patch("/api/v1/memories/"+id+"/read").header("Authorization",owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isNew").value(false));
        sessions.logout(owner);
        mvc.perform(get("/api/v1/memories").header("Authorization",owner)).andExpect(status().isUnauthorized());
    }
    @Test void realMomentReaderIncludesCompleteKoreanMonthAndCoordinates() {
        var snapshot=snapshots.capture(ownerId).orElseThrow();
        assertEquals(3,snapshot.moments().size());
        assertEquals(37.45,snapshot.request().moments().getFirst().location().latitude());
        assertNull(snapshot.request().moments().getFirst().music().artist());
        assertEquals(3,snapshot.request().scope().history_revision());
    }
    @Test void memoEditInvalidatesImmediatelyThenReanalysisKeepsIdAndReadState() {
        long id=analyze(); service.markRead(ownerId,id);
        moments.update(owner,ids.getFirst(),new MomentUpdateRequest("수정된 메모"));
        assertTrue(service.list(ownerId).content().isEmpty()); assertTrue(playlists.findOwned(id,ownerId).isEmpty());
        assertTrue(coordinator.synchronizeNext(ownerId));
        assertEquals(id,service.list(ownerId).content().getFirst().id()); assertFalse(service.list(ownerId).content().getFirst().isNew());
        assertEquals("수정된 메모",service.detail(ownerId,id).moments().getFirst().memo());
    }
    @Test void deletedMomentsAreNotRetainedInMemoryOrPlaylist() {
        long id=analyze();
        for(Long momentId:ids) moments.delete(owner,momentId);
        assertTrue(service.list(ownerId).content().isEmpty());
        assertTrue(coordinator.synchronizeNext(ownerId)); assertTrue(playlists.findOwned(id,ownerId).isEmpty());
        assertEquals(0,memories.findById(id).orElseThrow().getMomentCount());
    }
    @Test void staleResultIsDiscardedAfterRealMomentMutation() {
        var captured=snapshots.capture(ownerId).orElseThrow();
        moments.update(owner,ids.getFirst(),new MomentUpdateRequest("최신 메모"));
        assertFalse(results.apply(captured,response(captured.request()))); assertEquals(0,memories.count());
        analyze();
    }
    @Test void engineFailureKeepsPendingWorkForRetry() {
        doThrow(new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,"MEMORY_ENGINE_ERROR","분석 실패")).when(engine).analyze(any());
        assertThrows(ApiException.class,()->coordinator.synchronizeNext(ownerId));
        assertTrue(snapshots.capture(ownerId).isPresent());
    }
    @Test
    @org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named="REON_MEMORY_ENGINE_INTEGRATION", matches="true")
    void actualPythonEngineUsesRealMomentDatabaseAndBearerMemoryApi() throws Exception {
        var real = new MemoryEngineClient(org.springframework.web.client.RestClient.builder()
                .baseUrl("http://127.0.0.1:18083").build(),"reon-local-integration-token");
        doAnswer(call -> real.analyze(call.getArgument(0))).when(engine).analyze(any());
        long id = analyze();
        mvc.perform(get("/api/v1/memories/"+id).header("Authorization",owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$.momentCount").value(3));
        assertEquals(List.of("wJhWwt1OmT8"),playlists.findOwned(id,ownerId).orElseThrow().videoIds());
        moments.update(owner,ids.getFirst(),new MomentUpdateRequest("실제 엔진 재분석"));
        assertTrue(playlists.findOwned(id,ownerId).isEmpty());
        assertTrue(coordinator.synchronizeNext(ownerId));
        assertEquals(id,service.list(ownerId).content().getFirst().id());
        assertEquals("실제 엔진 재분석",service.detail(ownerId,id).moments().getFirst().memo());
    }
    @Test void playlistUsesActiveCanonicalMemoryWithoutReanalysis() {
        long id=analyze(); clearInvocations(engine);
        assertEquals(List.of("wJhWwt1OmT8"),playlists.findOwned(id,ownerId).orElseThrow().videoIds());
        verifyNoInteractions(engine);
    }
}
