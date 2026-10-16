package com.reon.backend.auth;

import com.reon.backend.auth.entity.AuthSession;
import com.reon.backend.auth.repository.AuthSessionRepository;
import com.reon.backend.auth.service.GoogleTokenVerifier;
import com.reon.backend.global.ApiException;
import com.reon.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.regex.Pattern;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired AuthSessionRepository sessions;
    @MockitoBean GoogleTokenVerifier verifier;

    @BeforeEach
    void setUp() {
        sessions.deleteAll();
        users.deleteAll();
        when(verifier.verify("valid-google-token")).thenReturn(
                new GoogleTokenVerifier.GoogleProfile("google-sub-1", "승환", "user@example.com", "https://example.com/profile.png"));
    }

    private String login() throws Exception {
        String json = mvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"valid-google-token\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.name").value("승환"))
                .andExpect(jsonPath("$.user.email").value("user@example.com"))
                .andExpect(jsonPath("$.user.id").isNumber())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        var match = Pattern.compile("\"accessToken\":\"([^\"]+)\"").matcher(json);
        assertTrue(match.find());
        return match.group(1);
    }

    private String hash(String token) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void loginStoresUserAndHashedSessionAndAllowsMe() throws Exception {
        String token = login();
        assertEquals(43, token.length());
        assertEquals(1, users.count());
        assertTrue(sessions.existsById(hash(token)));
        assertFalse(sessions.existsById(token));
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.googleSubject").doesNotExist());
    }

    @Test
    void repeatLoginUpdatesSameUserAndIssuesSeparateSessions() throws Exception {
        String first = login();
        Long id = users.findByGoogleSubject("google-sub-1").orElseThrow().getId();
        when(verifier.verify("updated-token")).thenReturn(
                new GoogleTokenVerifier.GoogleProfile("google-sub-1", "새 이름", "new@example.com", null));
        mvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"updated-token\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.name").value("새 이름"))
                .andExpect(jsonPath("$.user.id").value(id));
        assertEquals(1, users.count());
        assertEquals(2, sessions.count());
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + first))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("new@example.com"));
    }

    @Test
    void sameEmailDoesNotMergeDifferentGoogleSubjects() throws Exception {
        login();
        when(verifier.verify("different-subject")).thenReturn(
                new GoogleTokenVerifier.GoogleProfile("google-sub-2", "다른 계정", "user@example.com", null));
        mvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"different-subject\"}"))
                .andExpect(status().isOk());
        assertEquals(2, users.count());
    }

    @Test
    void logoutRevokesOnlyCurrentSession() throws Exception {
        String first = login();
        String second = login();
        assertNotEquals(first, second);
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + first))
                .andExpect(status().isOk()).andExpect(jsonPath("$.message").value("로그아웃되었습니다."));
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + first))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + second))
                .andExpect(status().isOk());
        assertEquals(1, users.count());
    }

    @Test
    void expiredSessionCannotAccessMeOrLogout() throws Exception {
        String token = login();
        var user = users.findByGoogleSubject("google-sub-1").orElseThrow();
        sessions.saveAndFlush(new AuthSession(hash(token), user, Instant.now().minusSeconds(1)));
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedAndMissingAuthorizationAreRejected() throws Exception {
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/logout")).andExpect(status().isUnauthorized());
        for (String header : new String[]{"Basic abc", "Bearer abc", "Bearer " + "a".repeat(43), "Bearer  " + "a".repeat(43)}) {
            mvc.perform(get("/api/v1/users/me").header("Authorization", header))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        }
    }

    @Test
    void invalidGoogleTokenDoesNotPersistAnything() throws Exception {
        when(verifier.verify("invalid-token")).thenThrow(new ApiException(HttpStatus.UNAUTHORIZED,
                "INVALID_GOOGLE_TOKEN", "유효하지 않은 Google 인증 정보입니다."));
        mvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"invalid-token\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_GOOGLE_TOKEN"));
        assertEquals(0, users.count());
        assertEquals(0, sessions.count());
    }

    @Test
    void loginRequiresValidRequestBody() throws Exception {
        for (String body : new String[]{"{}", "{\"idToken\":\" \"}", "{", "{\"idToken\":\"" + "a".repeat(8193) + "\"}"}) {
            mvc.perform(post("/api/v1/auth/google").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
        verifyNoInteractions(verifier);
    }
}
