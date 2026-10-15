package com.reon.backend.replay.dto;

import com.reon.backend.replay.entity.PlaylistExport;

public record PlaylistResponse(String playlistId, String playlistUrl, String title, int trackCount) {
    public static PlaylistResponse from(PlaylistExport export) {
        return new PlaylistResponse(export.getPlaylistId(), "https://music.youtube.com/playlist?list=" + export.getPlaylistId(),
                export.getTitle(), export.getTrackCount());
    }
}
