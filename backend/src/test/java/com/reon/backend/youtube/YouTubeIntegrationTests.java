package com.reon.backend.youtube;

import com.reon.backend.auth.repository.AuthSessionRepository;
import com.reon.backend.auth.service.SessionService;
import com.reon.backend.global.ApiException;
import com.reon.backend.user.entity.User;
import com.reon.backend.user.repository.UserRepository;
import com.reon.backend.youtube.entity.*;
import com.reon.backend.youtube.repository.*;
import com.reon.backend.youtube.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class YouTubeIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired SessionService sessions;
    @Autowired AuthSessionRepository authSessions;
    @Autowired UserRepository users;
    @Autowired YouTubeConnectionRepository connections;
    @Autowired YouTubeAuthorizationRepository authorizations;
    @Autowired YouTubeConnectionStore store;
    @Autowired TokenCipher cipher;
    @MockitoBean GoogleOAuthClient google;
    private String owner, other;
    private Long ownerId;
    private final JsonMapper json = JsonMapper.builder().build();
    @BeforeEach void setUp() {
        var user = users.saveAndFlush(new User("youtube-owner", "사용자", "owner@example.com", null));
        ownerId = user.getId(); owner = "Bearer " + sessions.issue(user);
        other = "Bearer " + sessions.issue(users.saveAndFlush(new User("youtube-other", "다른 사용자", "other@example.com", null)));
        when(google.authorizationUrl(anyString(), anyString())).thenAnswer(invocation ->
                "https://accounts.google.com/o/oauth2/v2/auth?state=" + invocation.getArgument(0) + "&code_challenge=" + invocation.getArgument(1));
        when(google.exchange(eq("code"), anyString())).thenReturn(tokens("access", "refresh"));
    }
    @AfterEach void cleanUp() {
        connections.deleteAll(); authorizations.deleteAll(); authSessions.deleteAll(); users.deleteAll();
    }
    private GoogleOAuthClient.Tokens tokens(String access, String refresh) {
        return new GoogleOAuthClient.Tokens(access, refresh, 3600L, "Bearer", GoogleOAuthClient.SCOPE);
    }
    private String start() throws Exception {
        var result = mvc.perform(post("/api/v1/integrations/youtube/authorize").header("Authorization", owner))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString();
        String url = json.readTree(result).get("authorizationUrl").asText();
        String query = URI.create(url).getRawQuery();
        return URLDecoder.decode(query.split("&")[0].split("=", 2)[1], StandardCharsets.UTF_8);
    }
    private org.springframework.test.web.servlet.ResultActions connect(String auth, String state) throws Exception {
        return mvc.perform(post("/api/v1/integrations/youtube/connect").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content("{\"authorizationCode\":\"code\",\"state\":\"" + state + "\"}"));
    }
    private void expiredConnection() {
        var connection = new YouTubeConnection(ownerId);
        connection.update(cipher.encrypt("old-access"), cipher.encrypt("refresh"), Instant.now().minusSeconds(1));
        connections.saveAndFlush(connection);
    }
    @Test void connectsAndStoresEncryptedTokensAndStatusIsUserScoped() throws Exception {
        connect(owner, start()).andExpect(status().isOk()).andExpect(jsonPath("$.connected").value(true))
                .andExpect(jsonPath("$.accessToken").doesNotExist());
        var connection = connections.findById(ownerId).orElseThrow();
        assertNotEquals("refresh", connection.getEncryptedRefreshToken());
        assertEquals("refresh", cipher.decrypt(connection.getEncryptedRefreshToken()));
        mvc.perform(get("/api/v1/integrations/youtube/status").header("Authorization", owner))
                .andExpect(jsonPath("$.connected").value(true)).andExpect(jsonPath("$.reauthRequired").value(false));
        mvc.perform(get("/api/v1/integrations/youtube/status").header("Authorization", other))
                .andExpect(jsonPath("$.connected").value(false)).andExpect(jsonPath("$.reauthRequired").value(false));
    }
    @Test void stateCannotBeUsedByAnotherUserOrReplayed() throws Exception {
        String state = start();
        connect(other, state).andExpect(status().isBadRequest());
        verify(google, never()).exchange(anyString(), anyString());
        connect(owner, state).andExpect(status().isOk());
        connect(owner, state).andExpect(status().isBadRequest());
        verify(google, times(1)).exchange(anyString(), anyString());
    }
    @Test void restartingInvalidatesOldState() throws Exception {
        String first = start(), second = start();
        assertNotEquals(first, second);
        connect(owner, first).andExpect(status().isBadRequest());
        connect(owner, second).andExpect(status().isOk());
    }
    @Test void expiredStateIsRejected() throws Exception {
        String state = start();
        var existing = authorizations.findById(ownerId).orElseThrow();
        authorizations.saveAndFlush(new YouTubeAuthorization(ownerId, existing.getStateHash(), existing.getEncryptedVerifier(), Instant.now().minusSeconds(1)));
        connect(owner, state).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_YOUTUBE_OAUTH_STATE"));
        verify(google, never()).exchange(anyString(), anyString());
    }
    @Test void exchangeFailureConsumesStateWithoutCreatingConnection() throws Exception {
        String state = start();
        when(google.exchange(eq("code"), anyString())).thenThrow(new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_OAUTH_UNAVAILABLE", "연결 실패"));
        connect(owner, state).andExpect(status().isBadGateway());
        assertFalse(authorizations.existsById(ownerId)); assertEquals(0, connections.count());
        connect(owner, state).andExpect(status().isBadRequest());
    }
    @Test void requiresRefreshTokenOnConnect() throws Exception {
        when(google.exchange(eq("code"), anyString())).thenReturn(tokens("access", null));
        connect(owner, start()).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("YOUTUBE_OFFLINE_ACCESS_REQUIRED"));
        assertEquals(0, connections.count());
    }
    @Test void refreshesExpiredAccessTokenAndRetainsRefreshToken() throws Exception {
        expiredConnection(); when(google.refresh("refresh")).thenReturn(tokens("new-access", null));
        mvc.perform(get("/api/v1/integrations/youtube/status").header("Authorization", owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(true));
        assertEquals("new-access", store.accessToken(ownerId));
        assertEquals("refresh", cipher.decrypt(connections.findById(ownerId).orElseThrow().getEncryptedRefreshToken()));
        verify(google, times(1)).refresh("refresh");
    }
    @Test void revokedRefreshTokenPersistsReauthFlag() throws Exception {
        expiredConnection(); when(google.refresh("refresh")).thenThrow(new GoogleOAuthClient.ReauthRequired());
        mvc.perform(get("/api/v1/integrations/youtube/status").header("Authorization", owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$.connected").value(false)).andExpect(jsonPath("$.reauthRequired").value(true));
        assertTrue(connections.findById(ownerId).orElseThrow().isReauthRequired());
        assertEquals("YOUTUBE_REAUTH_REQUIRED", assertThrows(ApiException.class, () -> store.accessToken(ownerId)).code());
        verify(google, times(1)).refresh("refresh");
    }
    @Test void temporaryRefreshFailureDoesNotDiscardConnection() throws Exception {
        expiredConnection(); when(google.refresh("refresh")).thenThrow(new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_OAUTH_UNAVAILABLE", "일시적 오류"));
        mvc.perform(get("/api/v1/integrations/youtube/status").header("Authorization", owner)).andExpect(status().isBadGateway());
        assertFalse(connections.findById(ownerId).orElseThrow().isReauthRequired());
        assertEquals("refresh", cipher.decrypt(connections.findById(ownerId).orElseThrow().getEncryptedRefreshToken()));
    }
    @Test void reconnectionReplacesTokensAndClearsReauthFlag() throws Exception {
        expiredConnection(); var old = connections.findById(ownerId).orElseThrow(); old.requireReauth(); connections.saveAndFlush(old);
        connect(owner, start()).andExpect(status().isOk());
        assertFalse(connections.findById(ownerId).orElseThrow().isReauthRequired()); assertEquals("access", store.accessToken(ownerId));
    }
    @Test void requiresSessionAndValidBody() throws Exception {
        mvc.perform(post("/api/v1/integrations/youtube/authorize")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/integrations/youtube/status")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/integrations/youtube/connect").header("Authorization", owner)
                .contentType(MediaType.APPLICATION_JSON).content("{\"authorizationCode\":\"code\"}"))
                .andExpect(status().isBadRequest());
        sessions.logout(owner);
        mvc.perform(post("/api/v1/integrations/youtube/authorize").header("Authorization", owner)).andExpect(status().isUnauthorized());
    }
}
