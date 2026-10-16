package com.reon.backend.mysql;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.memory.entity.Memory;
import com.reon.backend.memory.repository.MemoryRepository;
import com.reon.backend.moment.entity.Moment;
import com.reon.backend.moment.repository.MomentRepository;
import com.reon.backend.music.dto.MusicResolveResponse;
import com.reon.backend.replay.entity.PlaylistExport;
import com.reon.backend.replay.repository.PlaylistExportRepository;
import com.reon.backend.user.entity.User;
import com.reon.backend.user.repository.UserRepository;
import com.reon.backend.youtube.entity.YouTubeConnection;
import com.reon.backend.youtube.repository.YouTubeConnectionRepository;
import com.reon.backend.youtube.service.TokenCipher;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "REON_MYSQL_VERIFY", matches = "true")
@SpringBootTest(properties = {"spring.profiles.active=mysql", "spring.sql.init.mode=never"})
@Transactional
class MySqlPersistenceTests {
    @Autowired EntityManager em;
    @Autowired UserRepository users;
    @Autowired MomentRepository moments;
    @Autowired MemoryRepository memories;
    @Autowired SessionService sessions;
    @Autowired YouTubeConnectionRepository connections;
    @Autowired PlaylistExportRepository exports;
    @Autowired TokenCipher cipher;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) throws Exception {
        Properties properties = new Properties();
        try (var reader = Files.newBufferedReader(Path.of(".env"), StandardCharsets.UTF_8)) { properties.load(reader); }
        var names = Map.of("spring.datasource.url", "DB_URL", "spring.datasource.username", "DB_USERNAME", "spring.datasource.password", "DB_PASSWORD");
        String url = System.getenv().getOrDefault("DB_URL", properties.getProperty("DB_URL", ""));
        if (!url.matches("jdbc:mysql://[^/]+/reon_test(?:\\?.*)?")) {
            throw new IllegalStateException("MySQL verification requires the reon_test database");
        }
        names.forEach((property, name) -> registry.add(property, () -> System.getenv().getOrDefault(name, properties.getProperty(name))));
        registry.add("youtube.oauth.encryption-key", () -> Base64.getEncoder().encodeToString(new byte[32]));
        registry.add("spring.sql.init.mode", () -> "never");
    }
    private User user() {
        return users.saveAndFlush(new User("mysql-verification-" + UUID.randomUUID(), "검증 사용자 🎵", "verification@example.invalid", null));
    }
    private void reload() { em.flush(); em.clear(); }

    @Test void userProfileAndCaseSensitiveGoogleSubjectRoundTrip() {
        String subject = "mysql-case-" + UUID.randomUUID();
        var first = users.saveAndFlush(new User(subject + "A", "한글 🎵", "one@example.invalid", null));
        var second = users.saveAndFlush(new User(subject + "a", "다른 사용자", "two@example.invalid", null));
        Long firstId = first.getId(), secondId = second.getId(); reload();
        assertNotEquals(firstId, secondId); assertEquals("한글 🎵", users.findById(firstId).orElseThrow().getName());
    }
    @Test void momentTimestampUnicodeMemoUpdateAndDeleteRoundTrip() {
        var moment = moments.saveAndFlush(new Moment(user(), new MusicResolveResponse("wJhWwt1OmT8", "Live Forever", "Oasis - Topic", null),
                "검증 메모 🎵", Instant.parse("2026-10-13T00:00:00.123456789Z"), 37.45, 127.128));
        Long id = moment.getId(); reload();
        var stored = moments.findById(id).orElseThrow();
        assertEquals(Instant.parse("2026-10-13T00:00:00.123456Z"), stored.getRecordedAt());
        assertEquals("검증 메모 🎵", stored.getMemo()); assertEquals(37.45, stored.getLatitude());
        stored.updateMemo("수정된 메모"); reload(); assertEquals("수정된 메모", moments.findById(id).orElseThrow().getMemo());
        moments.deleteById(id); reload(); assertTrue(moments.findById(id).isEmpty());
    }
    @Test void longMemorySnapshotRoundTrip() {
        var memory = new Memory(user().getId(), "mem_0123456789abcdef", "2026-10");
        String snapshot = "{\"title\":\"긴 JSON 🎵\",\"content\":\"" + "한글".repeat(20000) + "\"}";
        memory.replace("TIME", "긴 JSON", "설명", java.time.LocalDate.of(2026,10,1), java.time.LocalDate.of(2026,10,2),
                "[]", snapshot, "a".repeat(64), 0, java.util.List.of()); memories.saveAndFlush(memory);
        Long id = memory.getId(); reload();
        assertEquals(snapshot, memories.findById(id).orElseThrow().getTracksJson());
    }
    @Test void bearerSessionPersistsAndLogoutRevokesIt() {
        var owner = user(); String token = sessions.issue(owner); reload();
        assertEquals(owner.getId(), sessions.currentUser("Bearer " + token).id());
        sessions.logout("Bearer " + token); reload();
        assertThrows(com.reon.backend.global.ApiException.class, () -> sessions.currentUser("Bearer " + token));
    }
    @Test void encryptedYoutubeTokensRoundTrip() {
        Long userId = user().getId(); var connection = new YouTubeConnection(userId);
        connection.update(cipher.encrypt("verification-access"), cipher.encrypt("verification-refresh"), Instant.now().plusSeconds(3600));
        connections.saveAndFlush(connection); reload();
        var stored = connections.findById(userId).orElseThrow();
        assertNotEquals("verification-refresh", stored.getEncryptedRefreshToken());
        assertEquals("verification-refresh", cipher.decrypt(stored.getEncryptedRefreshToken()));
    }
    @Test void completedPlaylistResultRoundTrip() {
        Long userId = user().getId(); var export = new PlaylistExport(userId, 987654321L, "검증 플레이리스트 🎵");
        export.snapshot(java.util.List.of("wJhWwt1OmT8", "abcdefghijk"));
        export.created("PL-verification"); export.trackAdded(); export.complete(); exports.saveAndFlush(export); reload();
        var stored = exports.findByUserIdAndMemoryId(userId, 987654321L).orElseThrow();
        assertEquals(java.util.List.of("wJhWwt1OmT8", "abcdefghijk"), stored.targetVideoIds());
        assertTrue(stored.isCompleted()); assertEquals(1, stored.getTrackCount()); assertEquals("PL-verification", stored.getPlaylistId());
    }
}
