package com.reon.backend.replay.service;

import com.reon.backend.auth.service.SessionService;
import com.reon.backend.global.ApiException;
import com.reon.backend.replay.dto.PlaylistResponse;
import com.reon.backend.replay.memory.MemoryPlaylistSource;
import com.reon.backend.youtube.service.YouTubeConnectionStore;
import com.reon.backend.youtube.service.YouTubePlaylistClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PlaylistService {
    private final SessionService sessions;
    private final MemoryPlaylistSource memories;
    private final YouTubeConnectionStore connections;
    private final YouTubePlaylistClient youtube;
    private final PlaylistExportStore exports;
    private final int maxTracks;
    public PlaylistService(SessionService sessions, MemoryPlaylistSource memories, YouTubeConnectionStore connections,
            YouTubePlaylistClient youtube, PlaylistExportStore exports, @Value("${replay.max-tracks:100}") int maxTracks) {
        if (maxTracks < 1) { throw new IllegalArgumentException("replay.max-tracks must be positive"); }
        this.sessions = sessions; this.memories = memories; this.connections = connections;
        this.youtube = youtube; this.exports = exports; this.maxTracks = maxTracks;
    }

    // Keep provider calls outside DB transactions; record each confirmed step separately.
    public PlaylistResponse create(String authorization, Long memoryId) {
        Long userId = sessions.currentUserId(authorization);
        if (memoryId < 1) { throw invalidMemory(); }
        var memory = memories.findOwned(memoryId, userId).orElseThrow(this::invalidMemory);
        var existing = exports.find(userId, memoryId);
        if (existing.isPresent()) {
            var export = existing.get();
            if (export.isCompleted()) { return PlaylistResponse.from(export); }
            throw new PlaylistCreationException(HttpStatus.CONFLICT, "PLAYLIST_CREATION_INCOMPLETE",
                    "생성 중이거나 완료되지 않은 플레이리스트가 있습니다. 기존 결과를 확인해주세요.", export);
        }
        if (memory.title() == null || memory.title().isBlank() || memory.title().length() > 150
                || memory.videoIds() == null || memory.videoIds().stream().anyMatch(id -> id == null || !id.matches("[A-Za-z0-9_-]{11}"))
                || (memory.description() != null && memory.description().length() > 5000)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_MEMORY_MUSIC", "Memory의 음악 또는 제목 정보가 올바르지 않습니다.");
        }
        var videoIds = memory.videoIds().stream().distinct().toList();
        if (videoIds.isEmpty() || videoIds.size() > maxTracks) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PLAYLIST_TRACK_COUNT", "플레이리스트 곡 수는 1~" + maxTracks + "곡이어야 합니다.");
        }
        String token;
        try { token = connections.accessToken(userId); }
        catch (ApiException exception) {
            if ("YOUTUBE_NOT_CONNECTED".equals(exception.code()) || "YOUTUBE_REAUTH_REQUIRED".equals(exception.code())) {
                throw new ApiException(HttpStatus.CONFLICT, "YOUTUBE_AUTH_REQUIRED", "YouTube 계정 권한 연결이 필요합니다.");
            }
            throw exception;
        }
        var export = exports.begin(userId, memoryId, memory.title());
        try {
            String playlistId = youtube.create(token, memory.title(), memory.description() == null ? "" : memory.description());
            exports.created(export.getId(), playlistId);
            for (String videoId : videoIds) {
                youtube.addVideo(token, playlistId, videoId);
                exports.trackAdded(export.getId());
            }
            return PlaylistResponse.from(exports.complete(export.getId()));
        } catch (RuntimeException exception) {
            exports.failed(export.getId());
            if (exception instanceof ApiException api && "YOUTUBE_AUTH_REQUIRED".equals(api.code())) { connections.requireReauth(userId); }
            var current = exports.find(userId, memoryId).orElseThrow();
            HttpStatus status = exception instanceof ApiException api ? api.status() : HttpStatus.BAD_GATEWAY;
            String code = exception instanceof ApiException api ? api.code() : "YOUTUBE_PLAYLIST_ERROR";
            throw new PlaylistCreationException(status, code,
                    "플레이리스트 생성을 완료하지 못했습니다. 확인된 곡 수와 기존 결과를 확인해주세요.", current);
        }
    }
    private ApiException invalidMemory() { return new ApiException(HttpStatus.NOT_FOUND, "MEMORY_NOT_FOUND", "존재하지 않는 Memory입니다."); }
}
