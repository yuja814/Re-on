package com.reon.backend.user.dto;

import com.reon.backend.user.entity.User;

public record UserResponse(Long id, String name, String email, String profileImageUrl) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getProfileImageUrl());
    }
}
