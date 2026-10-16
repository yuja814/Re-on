package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import com.reon.backend.youtube.repository.YouTubeConnectionRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Profile("dev")
@Service
public class DevTokenVerificationStore {
    private final YouTubeConnectionRepository connections;
    public DevTokenVerificationStore(YouTubeConnectionRepository connections) { this.connections = connections; }
    @Transactional
    public Instant expire(Long userId) {
        var connection = connections.lockByUserId(userId).orElseThrow(() ->
                new ApiException(HttpStatus.CONFLICT, "YOUTUBE_NOT_CONNECTED", "YouTube 연결이 필요합니다."));
        if (connection.isReauthRequired()) {
            throw new ApiException(HttpStatus.CONFLICT, "YOUTUBE_REAUTH_REQUIRED", "YouTube 권한을 다시 연결해주세요.");
        }
        Instant expired = Instant.now().minusSeconds(120);
        connection.update(connection.getEncryptedAccessToken(), null, expired);
        return expired;
    }
    @Transactional(readOnly = true)
    public Instant expiresAt(Long userId) { return connections.findById(userId).orElseThrow().getExpiresAt(); }
}
