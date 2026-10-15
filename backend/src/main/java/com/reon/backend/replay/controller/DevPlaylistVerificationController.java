package com.reon.backend.replay.controller;

import com.reon.backend.replay.dto.PlaylistResponse;
import com.reon.backend.replay.service.PlaylistService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@Profile("dev")
@RestController
public class DevPlaylistVerificationController {
    private final PlaylistService playlists;
    public DevPlaylistVerificationController(PlaylistService playlists) { this.playlists = playlists; }
    @PostMapping("/dev/memories/{memoryId}/playlist/fail")
    public ResponseEntity<PlaylistResponse> fail(@RequestHeader(value = "Authorization", required = false) String auth,
                                                @PathVariable Long memoryId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(playlists.verifyPartialFailure(auth, memoryId));
    }
}
