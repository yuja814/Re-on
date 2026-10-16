package com.reon.backend.moment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public record MomentCreateRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{11}", message = "올바른 videoId가 필요합니다.") String videoId,
        @Size(max = 2000, message = "메모는 2000자 이하여야 합니다.") String memo,
        @NotNull(message = "들은 시간이 필요합니다.") OffsetDateTime recordedAt,
        @Valid LocationDto location
) {}
