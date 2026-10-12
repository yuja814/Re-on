package com.reon.backend.auth.service;

import com.reon.backend.auth.dto.LoginResponse;
import com.reon.backend.user.dto.UserResponse;
import com.reon.backend.user.entity.User;
import com.reon.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final GoogleTokenVerifier verifier;
    private final UserRepository users;
    private final SessionService sessions;

    public AuthService(GoogleTokenVerifier verifier, UserRepository users, SessionService sessions) {
        this.verifier = verifier;
        this.users = users;
        this.sessions = sessions;
    }

    @Transactional
    public LoginResponse login(String idToken) {
        var profile = verifier.verify(idToken);
        User user = users.findByGoogleSubject(profile.subject()).orElseGet(() ->
                new User(profile.subject(), profile.name(), profile.email(), profile.profileImageUrl()));
        user.updateProfile(profile.name(), profile.email(), profile.profileImageUrl());
        // A unique Google subject prevents duplicate users on concurrent first logins.
        user = users.saveAndFlush(user);
        return new LoginResponse(sessions.issue(user), UserResponse.from(user));
    }
}
