package com.reon.backend.moment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MomentUpdateRequest(
        @NotNull(message = "변경할 메모를 입력해주세요. 빈 문자열로 메모를 지울 수 있습니다.")
        @Size(max = 2000, message = "메모는 2000자 이하여야 합니다.") String memo
) {}
