package com.reon.backend.memory.adapter;

import com.reon.backend.memory.port.MomentHistoryReader;
import com.reon.backend.memory.engine.EngineContract;
import com.reon.backend.moment.repository.MomentRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.List;

@Component
@Profile("!memory-test")
public class DatabaseMomentHistoryReader implements MomentHistoryReader {
    private final MomentRepository moments;
    public DatabaseMomentHistoryReader(MomentRepository moments) { this.moments = moments; }
    public List<Record> readCompleteMonth(long userId, YearMonth month) {
        var zone = ZoneId.of("Asia/Seoul");
        return moments.findByUserIdAndRecordedAtGreaterThanEqualAndRecordedAtLessThanOrderByRecordedAtAscIdAsc(userId,
                month.atDay(1).atStartOfDay(zone).toInstant(), month.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant())
                .stream().map(m -> new Record(m.getId(), userId, m.getRecordedAt().atOffset(ZoneOffset.UTC),
                        new EngineContract.Music(m.getVideoId(), m.getTitle(), null, m.getChannelTitle(), m.getThumbnailUrl(),
                                "https://music.youtube.com/watch?v=" + m.getVideoId()), m.getMemo(),
                        m.getLatitude() == null ? null : new EngineContract.Location(m.getLatitude(), m.getLongitude()))).toList();
    }
}
