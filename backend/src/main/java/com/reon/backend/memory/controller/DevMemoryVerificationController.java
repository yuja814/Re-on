package com.reon.backend.memory.controller;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.memory.service.MemorySyncService;
import com.reon.backend.moment.dto.MomentCreateRequest;
import com.reon.backend.moment.service.MomentService;
import com.reon.backend.global.ApiException;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@Profile("dev")
@RestController
@RequestMapping("/dev/memories")
public class DevMemoryVerificationController {
    private final SessionService sessions;
    private final MomentService moments;
    private final MemorySyncService sync;
    public DevMemoryVerificationController(SessionService sessions, MomentService moments, MemorySyncService sync) {
        this.sessions = sessions; this.moments = moments; this.sync = sync;
    }
    @PostMapping("/analyze")
    public ResponseEntity<List<MemorySyncService.SavedMemory>> analyze(
            @RequestHeader(value = "Authorization", required = false) String auth, @RequestParam String month) {
        Long userId = sessions.currentUserId(auth);
        YearMonth parsed;
        try { parsed = YearMonth.parse(month); } catch (DateTimeException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "month는 YYYY-MM 형식이어야 합니다.");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(sync.sync(userId, parsed));
    }
    @PostMapping("/test-records")
    public ResponseEntity<List<MemorySyncService.SavedMemory>> seed(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long userId = sessions.currentUserId(auth);
        YearMonth month = YearMonth.now(ZoneId.of("Asia/Seoul"));
        for (int i = 1; i <= 3; i++) {
            moments.create(auth, new MomentCreateRequest("wJhWwt1OmT8", "RE:PLAY 실제 연동 검증 기록", month.atDay(i).atTime(8, 30).atOffset(ZoneOffset.ofHours(9)), null));
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(sync.sync(userId, month));
    }
}
