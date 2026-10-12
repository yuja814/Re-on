package com.reon.backend.auth.controller;

import com.reon.backend.auth.dto.GoogleLoginRequest;
import com.reon.backend.auth.dto.LoginResponse;
import com.reon.backend.auth.service.AuthService;
import com.reon.backend.auth.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final SessionService sessions;

    public AuthController(AuthService authService, SessionService sessions) {
        this.authService = authService;
        this.sessions = sessions;
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> google(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(authService.login(request.idToken()));
    }

    public record LogoutResponse(String message) {}

    @PostMapping("/logout")
    public LogoutResponse logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        sessions.logout(authorization);
        return new LogoutResponse("로그아웃되었습니다.");
    }
}
