package com.reon.backend.moment.service;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.global.ApiException;
import com.reon.backend.moment.dto.*;
import com.reon.backend.moment.entity.Moment;
import com.reon.backend.moment.repository.MomentRepository;
import com.reon.backend.music.service.YouTubeClient;
import com.reon.backend.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.Base64;

@Service
public class MomentService {
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final MomentRepository moments;
    private final SessionService sessions;
    private final UserRepository users;
    private final YouTubeClient youTube;

    public MomentService(MomentRepository moments, SessionService sessions, UserRepository users, YouTubeClient youTube) {
        this.moments = moments;
        this.sessions = sessions;
        this.users = users;
        this.youTube = youTube;
    }

    @Transactional
    public MomentResponse create(String authorization, MomentCreateRequest request) {
        Long userId = sessions.currentUserId(authorization);
        int year = request.recordedAt().atZoneSameInstant(ZONE).getYear();
        if (year < 1970 || year > 9998) { throw invalid("들은 시간은 1970~9998년 범위여야 합니다."); }
        var music = youTube.findVideo(request.videoId());
        var location = request.location();
        Moment moment = new Moment(users.lockById(userId).orElseThrow(), music, request.memo(),
                request.recordedAt().toInstant(), location == null ? null : location.latitude(),
                location == null ? null : location.longitude());
        return MomentResponse.from(moments.saveAndFlush(moment));
    }

    @Transactional(readOnly = true)
    public MomentResponse detail(String authorization, Long id) {
        return MomentResponse.from(owned(id, sessions.currentUserId(authorization)));
    }

    @Transactional
    public MomentUpdateResponse update(String authorization, Long id, MomentUpdateRequest request) {
        Long userId = sessions.currentUserId(authorization);
        users.lockById(userId).orElseThrow();
        Moment moment = owned(id, userId);
        moment.updateMemo(request.memo());
        return new MomentUpdateResponse(moment.getId(), moment.getMemo(), moment.getUpdatedAt().atOffset(ZoneOffset.ofHours(9)));
    }

    @Transactional
    public void delete(String authorization, Long id) {
        Long userId = sessions.currentUserId(authorization);
        users.lockById(userId).orElseThrow();
        moments.delete(owned(id, userId));
    }

    @Transactional(readOnly = true)
    public MomentListResponse list(String authorization, Integer year, Integer month, int size, String cursor) {
        Long userId = sessions.currentUserId(authorization);
        if (size < 1 || size > 100) { throw invalid("size는 1~100 범위여야 합니다."); }
        if (year != null && (year < 1970 || year > 9998)) { throw invalid("year는 1970~9998 범위여야 합니다."); }
        if (month != null && (year == null || month < 1 || month > 12)) {
            throw invalid("month는 year와 함께 1~12 범위로 입력해주세요.");
        }
        Instant start = null;
        Instant end = null;
        if (year != null) {
            LocalDate date = LocalDate.of(year, month == null ? 1 : month, 1);
            start = date.atStartOfDay(ZONE).toInstant();
            end = (month == null ? date.plusYears(1) : date.plusMonths(1)).atStartOfDay(ZONE).toInstant();
        }
        Cursor decoded = cursor == null ? null : decode(cursor);
        var rows = moments.findNext(userId, start, end, decoded == null ? null : decoded.time(),
                decoded == null ? null : decoded.id(), PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        var visible = rows.subList(0, Math.min(size, rows.size()));
        String nextCursor = hasNext ? encode(visible.getLast()) : null;
        return new MomentListResponse(visible.stream().map(MomentListResponse.Item::from).toList(), nextCursor, hasNext);
    }

    private Moment owned(Long id, Long userId) {
        // Use the same response for missing records and another user's records.
        return moments.findByIdAndUserId(id, userId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "MOMENT_NOT_FOUND", "존재하지 않는 Moment입니다."));
    }

    private record Cursor(Instant time, Long id) {}

    private String encode(Moment moment) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                (moment.getRecordedAt() + "|" + moment.getId()).getBytes(StandardCharsets.UTF_8));
    }

    private Cursor decode(String encoded) {
        try {
            if (encoded.length() > 128 || !encoded.matches("[A-Za-z0-9_-]+")) { throw new IllegalArgumentException(); }
            String[] parts = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8).split("\\|", -1);
            if (parts.length != 2) { throw new IllegalArgumentException(); }
            Instant time = Instant.parse(parts[0]);
            long id = Long.parseLong(parts[1]);
            int year = time.atZone(ZONE).getYear();
            if (id < 1 || year < 1970 || year > 9998) { throw new IllegalArgumentException(); }
            return new Cursor(time, id);
        } catch (IllegalArgumentException | DateTimeException exception) {
            throw invalid("올바른 cursor가 아닙니다.");
        }
    }

    private ApiException invalid(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message);
    }
}
