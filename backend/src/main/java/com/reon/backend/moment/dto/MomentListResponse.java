package com.reon.backend.moment.dto;

import com.reon.backend.moment.entity.Moment;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

public record MomentListResponse(List<Item> content, String nextCursor, boolean hasNext) {
    public record Item(Long id, String title, String channelTitle, String thumbnailUrl, String memo, OffsetDateTime recordedAt) {
        public static Item from(Moment moment) {
            return new Item(moment.getId(), moment.getTitle(), moment.getChannelTitle(),
                    moment.getThumbnailUrl(), moment.getMemo(), moment.getRecordedAt().atOffset(ZoneOffset.ofHours(9)));
        }
    }
}
