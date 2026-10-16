package com.reon.backend.moment.dto;

import jakarta.validation.constraints.AssertTrue;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotNull;

public record LocationDto(@NotNull Double latitude, @NotNull Double longitude) {
    @JsonIgnore
    @AssertTrue(message = "위도는 -90~90, 경도는 -180~180 범위여야 합니다.")
    public boolean isValidCoordinates() {
        return latitude == null || longitude == null ||
                (Double.isFinite(latitude) && Double.isFinite(longitude)
                && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180);
    }
}
