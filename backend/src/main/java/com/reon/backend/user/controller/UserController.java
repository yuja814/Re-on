package com.reon.backend.user.controller;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.user.dto.UserResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final SessionService sessions;

    public UserController(SessionService sessions) { this.sessions = sessions; }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(sessions.currentUser(authorization));
    }
}
