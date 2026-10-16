package com.reon.backend.youtube.controller;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.global.ApiException;
import com.reon.backend.youtube.service.*;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;
import tools.jackson.databind.JsonNode;
import java.time.*;

@Profile("dev")
@RestController
public class DevTokenVerificationController {
    public record Result(boolean connected, boolean reauthRequired, Instant simulatedExpiredAt,
                         Instant expiresAt, boolean refreshed, boolean youtubeApiVerified) {}
    private final SessionService sessions;
    private final DevTokenVerificationStore verification;
    private final YouTubeConnectionStore connections;
    private final RestClient http;
    public DevTokenVerificationController(SessionService sessions, DevTokenVerificationStore verification,
                                          YouTubeConnectionStore connections, RestClient.Builder builder) {
        this.sessions = sessions; this.verification = verification; this.connections = connections;
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3)); factory.setReadTimeout(Duration.ofSeconds(5));
        this.http = builder.baseUrl("https://www.googleapis.com/youtube/v3").requestFactory(factory).build();
    }
    @PostMapping("/dev/youtube/verify-refresh")
    public ResponseEntity<Result> verify(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long userId = sessions.currentUserId(auth);
        Instant before = verification.expire(userId);
        var status = connections.status(userId);
        Instant after = verification.expiresAt(userId);
        boolean verified = false;
        if (status.connected()) {
            String token = connections.accessToken(userId);
            try {
                var response = http.get().uri("/playlists?part=id&mine=true&maxResults=1")
                        .headers(headers -> headers.setBearerAuth(token)).retrieve().body(JsonNode.class);
                verified = response != null && response.path("items").isArray();
                if (!verified) { throw new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_VERIFY_FAILED", "YouTube 조회 응답을 확인할 수 없습니다."); }
            } catch (RestClientResponseException exception) {
                if (exception.getStatusCode().value() == 401) { connections.requireReauth(userId); }
                throw new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_VERIFY_FAILED", "갱신 후 YouTube 조회에 실패했습니다. HTTP " + exception.getStatusCode().value());
            } catch (RestClientException exception) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "YOUTUBE_VERIFY_FAILED", "갱신 후 YouTube 조회에 실패했습니다.");
            }
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Result(status.connected(),
                status.reauthRequired(), before, after, after.isAfter(Instant.now().plusSeconds(60)), verified));
    }
}
