package com.reon.backend.moment;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.moment.repository.MomentRepository;
import com.reon.backend.music.dto.MusicResolveResponse;
import com.reon.backend.music.service.YouTubeClient;
import com.reon.backend.user.entity.User;
import com.reon.backend.user.repository.UserRepository;
import com.reon.backend.global.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.util.HashSet;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MomentIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired SessionService sessions;
    @Autowired UserRepository users;
    @Autowired MomentRepository moments;
    @MockitoBean YouTubeClient youtube;
    private final JsonMapper json = JsonMapper.builder().build();
    private String owner;
    private String other;

    @BeforeEach
    void setUp() {
        moments.deleteAll();
        owner = "Bearer " + sessions.issue(users.saveAndFlush(new User("moment-owner", "주인", "owner@example.com", null)));
        other = "Bearer " + sessions.issue(users.saveAndFlush(new User("moment-other", "다른 사용자", "other@example.com", null)));
        when(youtube.findVideo("wJhWwt1OmT8")).thenReturn(
                new MusicResolveResponse("wJhWwt1OmT8", "Live Forever", "Oasis - Topic", "https://example.com/high.jpg"));
    }

    private JsonNode create(String date, String location) throws Exception {
        String body = "{\"videoId\":\"wJhWwt1OmT8\",\"memo\":\"기록\",\"recordedAt\":\"" + date + "\",\"location\":" + location + "}";
        return json.readTree(mvc.perform(post("/api/v1/moments").header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString());
    }

    private JsonNode list(String authorization, String query) throws Exception {
        return json.readTree(mvc.perform(get("/api/v1/moments" + query).header("Authorization", authorization))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void createAndDetailPreserveMusicMemoAndLocation() throws Exception {
        var created = create("2026-10-11T08:30:00+09:00", "{\"latitude\":37.45,\"longitude\":127.128}");
        long id = created.get("id").asLong();
        mvc.perform(get("/api/v1/moments/" + id).header("Authorization", owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$.memo").value("기록"))
                .andExpect(jsonPath("$.music.videoId").value("wJhWwt1OmT8"))
                .andExpect(jsonPath("$.music.channelTitle").value("Oasis - Topic"))
                .andExpect(jsonPath("$.music.originalUrl").value("https://music.youtube.com/watch?v=wJhWwt1OmT8"))
                .andExpect(jsonPath("$.location.latitude").value(37.45))
                .andExpect(jsonPath("$.recordedAt").value("2026-10-11T08:30:00+09:00"));
        // Reading snapshots does not require another external call.
        verify(youtube, times(1)).findVideo("wJhWwt1OmT8");
    }

    @Test
    void missingMemoAndLocationAreOptional() throws Exception {
        mvc.perform(post("/api/v1/moments").header("Authorization", owner).contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoId\":\"wJhWwt1OmT8\",\"recordedAt\":\"2026-10-11T08:30:00+09:00\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.memo").value(""))
                .andExpect(jsonPath("$.location").isEmpty());
    }

    @Test
    void updateCanChangeAndClearOnlyMemo() throws Exception {
        long id = create("2026-10-11T08:30:00+09:00", "null").get("id").asLong();
        for (String memo : new String[]{"수정한 메모", ""}) {
            mvc.perform(patch("/api/v1/moments/" + id).header("Authorization", owner).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"memo\":\"" + memo + "\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.memo").value(memo))
                    .andExpect(jsonPath("$.updatedAt").exists());
        }
        mvc.perform(get("/api/v1/moments/" + id).header("Authorization", owner))
                .andExpect(jsonPath("$.music.title").value("Live Forever"))
                .andExpect(jsonPath("$.recordedAt").value("2026-10-11T08:30:00+09:00"));
    }

    @Test
    void deleteReturns204AndRecordDisappears() throws Exception {
        long id = create("2026-10-11T08:30:00+09:00", "null").get("id").asLong();
        mvc.perform(delete("/api/v1/moments/" + id).header("Authorization", owner))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(get("/api/v1/moments/" + id).header("Authorization", owner))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MOMENT_NOT_FOUND"));
        assertEquals(0, moments.count());
    }

    @Test
    void otherUserCannotReadUpdateDeleteOrListOwnersRecord() throws Exception {
        long id = create("2026-10-11T08:30:00+09:00", "null").get("id").asLong();
        mvc.perform(get("/api/v1/moments/" + id).header("Authorization", other)).andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/moments/" + id).header("Authorization", other).contentType(MediaType.APPLICATION_JSON)
                .content("{\"memo\":\"침범\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/moments/" + id).header("Authorization", other)).andExpect(status().isNotFound());
        assertEquals(0, list(other, "").get("content").size());
        assertEquals("기록", moments.findById(id).orElseThrow().getMemo());
    }

    @Test
    void allOperationsRequireValidSession() throws Exception {
        mvc.perform(get("/api/v1/moments")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/moments/1")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/moments/1")).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/moments/1").contentType(MediaType.APPLICATION_JSON).content("{\"memo\":\"x\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/moments").contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoId\":\"wJhWwt1OmT8\",\"recordedAt\":\"2026-10-11T08:30:00+09:00\"}"))
                .andExpect(status().isUnauthorized());
        sessions.logout(owner);
        mvc.perform(get("/api/v1/moments").header("Authorization", owner)).andExpect(status().isUnauthorized());
        verifyNoInteractions(youtube);
    }

    @Test
    void cursorPaginationHasNoDuplicatesWithEqualTimestampsAndDeletedAnchor() throws Exception {
        var expected = new HashSet<Long>();
        for (int i = 0; i < 4; i++) {
            expected.add(create("2026-10-11T08:30:00.123456789+09:00", "null").get("id").asLong());
        }
        var first = list(owner, "?size=2");
        assertTrue(first.get("hasNext").asBoolean());
        var found = new HashSet<Long>();
        for (var row : first.get("content")) { found.add(row.get("id").asLong()); }
        assertTrue(first.get("content").get(0).get("id").asLong() > first.get("content").get(1).get("id").asLong());
        // The cursor works from its timestamp and ID even when the anchor was deleted.
        mvc.perform(delete("/api/v1/moments/" + first.get("content").get(1).get("id").asLong())
                .header("Authorization", owner)).andExpect(status().isNoContent());
        var second = list(owner, "?size=2&cursor=" + first.get("nextCursor").asText());
        assertFalse(second.get("hasNext").asBoolean());
        assertTrue(second.get("nextCursor").isNull());
        for (var row : second.get("content")) { assertTrue(found.add(row.get("id").asLong())); }
        assertEquals(expected, found);
    }

    @Test
    void paginationSortsByRecordedTimeRatherThanCreationOrder() throws Exception {
        long recent = create("2026-10-11T09:00:00+09:00", "null").get("id").asLong();
        long old = create("2026-10-10T09:00:00+09:00", "null").get("id").asLong();
        var first = list(owner, "?size=1");
        assertEquals(recent, first.get("content").get(0).get("id").asLong());
        var second = list(owner, "?size=1&cursor=" + first.get("nextCursor").asText());
        assertEquals(old, second.get("content").get(0).get("id").asLong());
    }

    @Test
    void dateFilterUsesKoreanMonthBoundaries() throws Exception {
        create("2026-09-30T14:59:59Z", "null");
        long included = create("2026-09-30T15:00:00Z", "null").get("id").asLong();
        create("2026-10-31T15:00:00Z", "null");
        var october = list(owner, "?year=2026&month=10");
        assertEquals(1, october.get("content").size());
        assertEquals(included, october.get("content").get(0).get("id").asLong());
        assertEquals(3, list(owner, "?year=2026").get("content").size());
        assertEquals(0, list(owner, "?year=2025").get("content").size());
    }

    @Test
    void rejectsInvalidFiltersCursorAndPath() throws Exception {
        for (String query : new String[]{"?size=0", "?size=101", "?year=1969", "?year=9999", "?month=10", "?year=2026&month=13",
                "?cursor=bad", "?cursor=", "?size=abc", "?year=abc", "?cursor=" + "a".repeat(129)}) {
            mvc.perform(get("/api/v1/moments" + query).header("Authorization", owner))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
        mvc.perform(get("/api/v1/moments/abc").header("Authorization", owner)).andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidPayloadsBeforeCallingYoutube() throws Exception {
        String prefix = "{\"videoId\":\"wJhWwt1OmT8\",\"recordedAt\":\"2026-10-11T08:30:00+09:00\",";
        for (String body : new String[]{"{}", "{", "{\"videoId\":\"short\",\"recordedAt\":\"2026-10-11T08:30:00+09:00\"}",
                prefix + "\"memo\":\"" + "a".repeat(2001) + "\"}",
                prefix + "\"location\":{\"latitude\":91,\"longitude\":127}}",
                prefix + "\"location\":{\"latitude\":37,\"longitude\":181}}",
                prefix + "\"location\":{\"latitude\":37}}"}) {
            mvc.perform(post("/api/v1/moments").header("Authorization", owner).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(youtube);
        assertEquals(0, moments.count());
    }

    @Test
    void invalidPatchIsRejectedWithoutChangingMemo() throws Exception {
        long id = create("2026-10-11T08:30:00+09:00", "null").get("id").asLong();
        for (String body : new String[]{"{}", "{\"memo\":null}", "{\"memo\":\"" + "a".repeat(2001) + "\"}"}) {
            mvc.perform(patch("/api/v1/moments/" + id).header("Authorization", owner).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        assertEquals("기록", moments.findById(id).orElseThrow().getMemo());
    }

    @Test
    void youtubeFailureDoesNotCreateMoment() throws Exception {
        when(youtube.findVideo("wJhWwt1OmT8")).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "MUSIC_NOT_FOUND", "음악 없음"));
        mvc.perform(post("/api/v1/moments").header("Authorization", owner).contentType(MediaType.APPLICATION_JSON)
                .content("{\"videoId\":\"wJhWwt1OmT8\",\"recordedAt\":\"2026-10-11T08:30:00+09:00\"}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MUSIC_NOT_FOUND"));
        assertEquals(0, moments.count());
    }
}
