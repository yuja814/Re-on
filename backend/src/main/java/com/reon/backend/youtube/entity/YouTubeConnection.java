package com.reon.backend.youtube.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "youtube_connections")
public class YouTubeConnection {
    @Id @Column(name = "user_id") private Long userId;
    @Column(name = "encrypted_access_token", nullable = false, length = 8192) private String encryptedAccessToken;
    @Column(name = "encrypted_refresh_token", nullable = false, length = 8192) private String encryptedRefreshToken;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "reauth_required", nullable = false) private boolean reauthRequired;
    protected YouTubeConnection() {}
    public YouTubeConnection(Long userId) { this.userId = userId; }
    public void update(String access, String refresh, Instant expiresAt) {
        this.encryptedAccessToken = access;
        if (refresh != null) { this.encryptedRefreshToken = refresh; }
        this.expiresAt = expiresAt; this.reauthRequired = false;
    }
    public void requireReauth() { this.reauthRequired = true; }
    public String getEncryptedAccessToken() { return encryptedAccessToken; }
    public String getEncryptedRefreshToken() { return encryptedRefreshToken; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isReauthRequired() { return reauthRequired; }
}
