package com.reon.backend.replay;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.auth.repository.AuthSessionRepository;
import com.reon.backend.global.ApiException;
import com.reon.backend.replay.memory.MemoryPlaylistSource;
import com.reon.backend.replay.repository.PlaylistExportRepository;
import com.reon.backend.user.entity.User;
import com.reon.backend.user.repository.UserRepository;
import com.reon.backend.youtube.service.YouTubeConnectionStore;
import com.reon.backend.youtube.service.YouTubePlaylistClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PlaylistIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired SessionService sessions;
    @Autowired AuthSessionRepository authSessions;
    @Autowired UserRepository users;
    @Autowired PlaylistExportRepository exports;
    @MockitoBean MemoryPlaylistSource memories;
    @MockitoBean YouTubeConnectionStore connections;
    @MockitoBean YouTubePlaylistClient youtube;
    private Long ownerId;
    private String owner, other;
    @BeforeEach void setUp() {
        var user = users.saveAndFlush(new User("replay-owner", "사용자", "owner@example.com", null));
        ownerId = user.getId(); owner = "Bearer " + sessions.issue(user);
        other = "Bearer " + sessions.issue(users.saveAndFlush(new User("replay-other", "다른 사용자", "other@example.com", null)));
        when(memories.findOwned(201L, ownerId)).thenReturn(Optional.of(new MemoryPlaylistSource.MemoryMusic(
                "Memory title", "description", List.of("wJhWwt1OmT8", "abcdefghijk", "wJhWwt1OmT8"))));
        when(connections.accessToken(ownerId)).thenReturn("token");
        when(youtube.create("token", "Memory title", "description")).thenReturn("PL123");
    }
    @AfterEach void cleanUp() { exports.deleteAll(); authSessions.deleteAll(); users.deleteAll(); }
    private org.springframework.test.web.servlet.ResultActions create(String auth) throws Exception {
        return mvc.perform(post("/api/v1/memories/201/playlist").header("Authorization", auth));
    }
    @Test void createsDeduplicatedPlaylistAndReusesCompletedResult() throws Exception {
        for (int i = 0; i < 2; i++) {
            create(owner).andExpect(status().isOk()).andExpect(jsonPath("$.playlistId").value("PL123"))
                    .andExpect(jsonPath("$.playlistUrl").value("https://music.youtube.com/playlist?list=PL123"))
                    .andExpect(jsonPath("$.trackCount").value(2));
        }
        verify(youtube, times(1)).create("token", "Memory title", "description");
        var order = inOrder(youtube);
        order.verify(youtube).create("token", "Memory title", "description");
        order.verify(youtube).addVideo("token", "PL123", "wJhWwt1OmT8");
        order.verify(youtube).addVideo("token", "PL123", "abcdefghijk");
        assertEquals(1, exports.count());
    }
    @Test void missingOrNonOwnedMemoryDoesNotCallYoutube() throws Exception {
        create(other).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MEMORY_NOT_FOUND"));
        mvc.perform(post("/api/v1/memories/999/playlist").header("Authorization", owner)).andExpect(status().isNotFound());
        verifyNoInteractions(youtube, connections); assertEquals(0, exports.count());
    }
    @Test void requiresSession() throws Exception {
        mvc.perform(post("/api/v1/memories/201/playlist")).andExpect(status().isUnauthorized());
        sessions.logout(owner); create(owner).andExpect(status().isUnauthorized());
        verifyNoInteractions(memories, youtube);
    }
    @Test void missingYoutubeConnectionDoesNotCreateExport() throws Exception {
        when(connections.accessToken(ownerId)).thenThrow(new ApiException(HttpStatus.CONFLICT, "YOUTUBE_NOT_CONNECTED", "연결 필요"));
        create(owner).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("YOUTUBE_AUTH_REQUIRED"));
        assertEquals(0, exports.count()); verifyNoInteractions(youtube);
    }
    @Test void partialFailureReturnsLinkAndConfirmedCountAndBlocksDuplicateCreate() throws Exception {
        doThrow(new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_PLAYLIST_ERROR", "실패"))
                .when(youtube).addVideo("token", "PL123", "abcdefghijk");
        create(owner).andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.playlistUrl").value("https://music.youtube.com/playlist?list=PL123"))
                .andExpect(jsonPath("$.confirmedTrackCount").value(1));
        create(owner).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PLAYLIST_CREATION_INCOMPLETE"));
        verify(youtube, times(1)).create(anyString(), anyString(), anyString());
    }
    @Test void ambiguousCreateFailureBlocksAutomaticRetryEvenWithoutKnownPlaylistId() throws Exception {
        when(youtube.create(anyString(), anyString(), anyString())).thenThrow(new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_PLAYLIST_ERROR", "실패"));
        create(owner).andExpect(status().isBadGateway()).andExpect(jsonPath("$.playlistUrl").isEmpty());
        create(owner).andExpect(status().isConflict()); verify(youtube, times(1)).create(anyString(), anyString(), anyString());
    }
    @Test void provider401MarksConnectionForReauth() throws Exception {
        when(youtube.create(anyString(), anyString(), anyString())).thenThrow(new ApiException(HttpStatus.CONFLICT, "YOUTUBE_AUTH_REQUIRED", "권한 없음"));
        create(owner).andExpect(status().isConflict()); verify(connections).requireReauth(ownerId);
    }
    @Test void emptyOrInvalidMemoryMusicIsRejected() throws Exception {
        for (var ids : List.of(List.<String>of(), List.of("invalid-id"))) {
            when(memories.findOwned(201L, ownerId)).thenReturn(Optional.of(new MemoryPlaylistSource.MemoryMusic("title", "", ids)));
            create(owner).andExpect(status().isUnprocessableEntity());
        }
        verifyNoInteractions(youtube); assertEquals(0, exports.count());
    }
}
