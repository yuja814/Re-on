package com.reon.backend.auth.dto;

import com.reon.backend.user.dto.UserResponse;

public record LoginResponse(String accessToken, UserResponse user) {}
