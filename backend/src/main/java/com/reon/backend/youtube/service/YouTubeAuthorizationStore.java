package com.reon.backend.youtube.service;

import com.reon.backend.global.ApiException;
import com.reon.backend.youtube.entity.YouTubeAuthorization;
import com.reon.backend.youtube.repository.YouTubeAuthorizationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class YouTubeAuthorizationStore {
    public record Started(String state, String challenge) {}
    private final YouTubeAuthorizationRepository requests;
    private final TokenCipher cipher;
    private final SecureRandom random = new SecureRandom();
    public YouTubeAuthorizationStore(YouTubeAuthorizationRepository requests, TokenCipher cipher) {
        this.requests = requests; this.cipher = cipher;
    }

    @Transactional
    public Started start(Long userId) {
        cipher.requireConfigured();
        requests.lockByUserId(userId).ifPresent(requests::delete);
        requests.flush();
        String state = randomValue(), verifier = randomValue();
        requests.saveAndFlush(new YouTubeAuthorization(userId, hash(state), cipher.encrypt(verifier), Instant.now().plusSeconds(600)));
        return new Started(state, Base64.getUrlEncoder().withoutPadding().encodeToString(digest(verifier)));
    }

    // Separate transaction: successful consumption commits before Google's one-use code exchange.
    @Transactional
    public String consume(Long userId, String state) {
        var request = requests.lockByUserId(userId).orElseThrow(this::invalidState);
        if (!request.getExpiresAt().isAfter(Instant.now()) ||
                !MessageDigest.isEqual(request.getStateHash().getBytes(StandardCharsets.US_ASCII), hash(state).getBytes(StandardCharsets.US_ASCII))) {
            throw invalidState();
        }
        String verifier = cipher.decrypt(request.getEncryptedVerifier());
        requests.delete(request); requests.flush(); return verifier;
    }

    private String randomValue() {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private byte[] digest(String value) {
        try { return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }
    private String hash(String value) { return HexFormat.of().formatHex(digest(value)); }
    private ApiException invalidState() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_YOUTUBE_OAUTH_STATE", "YouTube 연결 요청이 만료되었거나 유효하지 않습니다. 연결을 다시 시작해주세요.");
    }
}
