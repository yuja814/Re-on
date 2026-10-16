package com.reon.backend.youtube.controller;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.youtube.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/integrations/youtube")
public class YouTubeIntegrationController {
    public record ConnectRequest(@NotBlank @Size(max = 4096) String authorizationCode,
            @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String state) {}
    public record ConnectResponse(boolean connected) {}
    public record AuthorizationResponse(String authorizationUrl) {}
    private final SessionService sessions;
    private final GoogleOAuthClient google;
    private final TokenCipher cipher;
    private final YouTubeAuthorizationStore authorizations;
    private final YouTubeConnectionStore connections;

    public YouTubeIntegrationController(SessionService sessions, GoogleOAuthClient google, TokenCipher cipher,
            YouTubeAuthorizationStore authorizations, YouTubeConnectionStore connections) {
        this.sessions = sessions; this.google = google; this.cipher = cipher;
        this.authorizations = authorizations; this.connections = connections;
    }

    @PostMapping("/authorize")
    public ResponseEntity<AuthorizationResponse> authorize(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long userId = sessions.currentUserId(auth);
        google.requireConfigured(); cipher.requireConfigured();
        var started = authorizations.start(userId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new AuthorizationResponse(google.authorizationUrl(started.state(), started.challenge())));
    }

    @PostMapping("/connect")
    public ResponseEntity<ConnectResponse> connect(@RequestHeader(value = "Authorization", required = false) String auth,
            @Valid @RequestBody ConnectRequest request) {
        Long userId = sessions.currentUserId(auth);
        google.requireConfigured(); cipher.requireConfigured();
        String verifier = authorizations.consume(userId, request.state());
        var tokens = google.exchange(request.authorizationCode(), verifier);
        connections.save(userId, tokens);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new ConnectResponse(true));
    }

    @GetMapping("/status")
    public ResponseEntity<YouTubeConnectionStore.Status> status(@RequestHeader(value = "Authorization", required = false) String auth) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(connections.status(sessions.currentUserId(auth)));
    }
}
