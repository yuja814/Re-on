package com.reon.backend.replay.controller;

import com.reon.backend.replay.dto.PlaylistResponse;
import com.reon.backend.replay.service.PlaylistService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/memories")
public class PlaylistController {
    private final PlaylistService playlists;
    public PlaylistController(PlaylistService playlists) { this.playlists = playlists; }
    @PostMapping("/{memoryId}/playlist/resume")
    public ResponseEntity<PlaylistResponse> resume(@RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long memoryId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(playlists.resume(auth, memoryId));
    }
    @PostMapping("/{memoryId}/playlist")
    public ResponseEntity<PlaylistResponse> create(@RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long memoryId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(playlists.create(auth, memoryId));
    }
}
