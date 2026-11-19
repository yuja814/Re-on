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
    private final com.reon.backend.auth.service.SessionService sessions;
    private final com.reon.backend.replay.service.PlaylistExportStore exports;
    private final com.reon.backend.youtube.service.YouTubeConnectionStore connections;
    private final com.reon.backend.youtube.service.YouTubePlaylistClient youtube;
    public DevPlaylistVerificationController(PlaylistService playlists, com.reon.backend.auth.service.SessionService sessions,
            com.reon.backend.replay.service.PlaylistExportStore exports, com.reon.backend.youtube.service.YouTubeConnectionStore connections,
            com.reon.backend.youtube.service.YouTubePlaylistClient youtube) {
        this.playlists = playlists; this.sessions = sessions; this.exports = exports; this.connections = connections; this.youtube = youtube;
    }
    public record Verification(String playlistId, int expectedTrackCount, int actualTrackCount, boolean orderMatches,
                               boolean privatePlaylist, java.util.List<String> videoIds) {}
    @GetMapping("/api/v1/dev/memories/{memoryId}/playlist/verify")
    public ResponseEntity<Verification> verify(@RequestHeader(value="Authorization",required=false) String auth, @PathVariable Long memoryId) {
        Long userId = sessions.currentUserId(auth);
        var export = exports.find(userId,memoryId).orElseThrow(() -> new com.reon.backend.global.ApiException(
                HttpStatus.NOT_FOUND,"PLAYLIST_EXPORT_NOT_FOUND","생성 이력이 없습니다."));
        if(export.getPlaylistId()==null)throw new com.reon.backend.global.ApiException(HttpStatus.CONFLICT,"PLAYLIST_RECOVERY_BLOCKED","플레이리스트 ID가 없습니다.");
        String token = connections.accessToken(userId);
        var actual = youtube.videoIds(token,export.getPlaylistId());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Verification(export.getPlaylistId(),
                export.targetVideoIds().size(),actual.size(),actual.equals(export.targetVideoIds()),youtube.isPrivate(token,export.getPlaylistId()),actual));
    }
    @PostMapping({"/dev/memories/{memoryId}/playlist/fail", "/api/v1/dev/memories/{memoryId}/playlist/fail"})
    public ResponseEntity<PlaylistResponse> fail(@RequestHeader(value = "Authorization", required = false) String auth,
                                                @PathVariable Long memoryId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(playlists.verifyPartialFailure(auth, memoryId));
    }
}
