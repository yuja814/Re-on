package com.reon.backend.auth.service;

import com.reon.backend.auth.entity.AuthSession;
import com.reon.backend.auth.repository.AuthSessionRepository;
import com.reon.backend.global.ApiException;
import com.reon.backend.user.dto.UserResponse;
import com.reon.backend.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class SessionService {
    private final AuthSessionRepository sessions;
    private final Duration ttl;
    private final SecureRandom random = new SecureRandom();

    public SessionService(AuthSessionRepository sessions, @Value("${auth.session-ttl}") Duration ttl) {
        if (ttl.isZero() || ttl.isNegative()) { throw new IllegalArgumentException("Session TTL must be positive"); }
        this.sessions = sessions;
        this.ttl = ttl;
    }

    @Transactional
    public String issue(User user) {
        Instant now = Instant.now();
        sessions.deleteByExpiresAtLessThanEqual(now);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.save(new AuthSession(hash(token), user, now.plus(ttl)));
        return token;
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String authorization) {
        return UserResponse.from(requireSession(authorization).getUser());
    }

    @Transactional(readOnly = true)
    public Long currentUserId(String authorization) {
        return requireSession(authorization).getUser().getId();
    }

    @Transactional
    public void logout(String authorization) {
        sessions.delete(requireSession(authorization));
    }

    private AuthSession requireSession(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw unauthorized();
        }
        String token = authorization.substring(7);
        if (!token.matches("[A-Za-z0-9_-]{43}")) { throw unauthorized(); }
        AuthSession session = sessions.findById(hash(token)).orElseThrow(this::unauthorized);
        if (!session.getExpiresAt().isAfter(Instant.now())) { throw unauthorized(); }
        return session;
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }

    private ApiException unauthorized() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
    }
}
