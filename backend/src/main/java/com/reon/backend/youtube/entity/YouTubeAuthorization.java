package com.reon.backend.youtube.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "youtube_authorizations")
public class YouTubeAuthorization {
    @Id @Column(name = "user_id") private Long userId;
    @Column(name = "state_hash", nullable = false, length = 64) private String stateHash;
    @Column(name = "encrypted_verifier", nullable = false, length = 512) private String encryptedVerifier;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    protected YouTubeAuthorization() {}
    public YouTubeAuthorization(Long userId, String stateHash, String encryptedVerifier, Instant expiresAt) {
        this.userId = userId; this.stateHash = stateHash;
        this.encryptedVerifier = encryptedVerifier; this.expiresAt = expiresAt;
    }
    public String getStateHash() { return stateHash; }
    public String getEncryptedVerifier() { return encryptedVerifier; }
    public Instant getExpiresAt() { return expiresAt; }
}
