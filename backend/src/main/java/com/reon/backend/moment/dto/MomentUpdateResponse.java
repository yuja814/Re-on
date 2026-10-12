package com.reon.backend.moment.dto;

import java.time.OffsetDateTime;

public record MomentUpdateResponse(Long id, String memo, OffsetDateTime updatedAt) {}
