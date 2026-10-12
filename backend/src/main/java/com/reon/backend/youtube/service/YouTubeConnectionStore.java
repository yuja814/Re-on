package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import com.reon.backend.youtube.entity.YouTubeConnection;
import com.reon.backend.youtube.repository.YouTubeConnectionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class YouTubeConnectionStore {
    public record Status(boolean connected, boolean reauthRequired) {}
    private final YouTubeConnectionRepository connections;
    private final TokenCipher cipher;
    private final GoogleOAuthClient google;
    public YouTubeConnectionStore(YouTubeConnectionRepository connections, TokenCipher cipher, GoogleOAuthClient google) {
        this.connections = connections; this.cipher = cipher; this.google = google;
    }

    @Transactional
    public void save(Long userId, GoogleOAuthClient.Tokens tokens) {
        if (tokens.refreshToken() == null || tokens.refreshToken().isBlank()) {
            throw new ApiException(HttpStatus.CONFLICT, "YOUTUBE_OFFLINE_ACCESS_REQUIRED", "오프라인 접근 권한이 필요합니다. 연결을 다시 시작해주세요.");
        }
        var connection = connections.lockByUserId(userId).orElseGet(() -> new YouTubeConnection(userId));
        connection.update(cipher.encrypt(tokens.accessToken()), cipher.encrypt(tokens.refreshToken()), Instant.now().plusSeconds(tokens.expiresIn()));
        connections.saveAndFlush(connection);
    }

    @Transactional
    public Status status(Long userId) {
        var connection = connections.lockByUserId(userId).orElse(null);
        if (connection == null) { return new Status(false, false); }
        refreshIfNeeded(connection);
        return new Status(!connection.isReauthRequired(), connection.isReauthRequired());
    }

    // Playlist code will call this with an already authenticated user's ID.
    @Transactional(noRollbackFor = ApiException.class)
    public String accessToken(Long userId) {
        var connection = connections.lockByUserId(userId).orElseThrow(() ->
                new ApiException(HttpStatus.CONFLICT, "YOUTUBE_NOT_CONNECTED", "YouTube 권한 연결이 필요합니다."));
        refreshIfNeeded(connection);
        if (connection.isReauthRequired()) {
            throw new ApiException(HttpStatus.CONFLICT, "YOUTUBE_REAUTH_REQUIRED", "YouTube 권한을 다시 연결해주세요.");
        }
        return cipher.decrypt(connection.getEncryptedAccessToken());
    }

    @Transactional
    public void requireReauth(Long userId) {
        connections.lockByUserId(userId).ifPresent(connection -> connection.requireReauth());
    }

    private void refreshIfNeeded(YouTubeConnection connection) {
        if (connection.isReauthRequired() || connection.getExpiresAt().isAfter(Instant.now().plusSeconds(60))) { return; }
        try {
            var tokens = google.refresh(cipher.decrypt(connection.getEncryptedRefreshToken()));
            String rotated = tokens.refreshToken() == null || tokens.refreshToken().isBlank() ? null : cipher.encrypt(tokens.refreshToken());
            connection.update(cipher.encrypt(tokens.accessToken()), rotated, Instant.now().plusSeconds(tokens.expiresIn()));
        } catch (GoogleOAuthClient.ReauthRequired exception) { connection.requireReauth(); }
        catch (ApiException exception) {
            if ("YOUTUBE_SCOPE_REQUIRED".equals(exception.code())) { connection.requireReauth(); }
            else { throw exception; }
        }
    }
}
