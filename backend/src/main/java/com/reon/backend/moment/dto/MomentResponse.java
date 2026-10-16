package com.reon.backend.moment.dto;

import com.reon.backend.moment.entity.Moment;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public record MomentResponse(Long id, Music music, String memo, OffsetDateTime recordedAt, LocationDto location) {
    public record Music(String videoId, String title, String channelTitle, String thumbnailUrl, String originalUrl) {}

    public static MomentResponse from(Moment moment) {
        return new MomentResponse(moment.getId(), new Music(moment.getVideoId(), moment.getTitle(),
                moment.getChannelTitle(), moment.getThumbnailUrl(),
                "https://music.youtube.com/watch?v=" + moment.getVideoId()), moment.getMemo(),
                moment.getRecordedAt().atOffset(ZoneOffset.ofHours(9)),
                moment.getLatitude() == null ? null : new LocationDto(moment.getLatitude(), moment.getLongitude()));
    }
}
