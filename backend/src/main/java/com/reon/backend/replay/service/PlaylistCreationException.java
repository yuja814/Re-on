package com.reon.backend.replay.service;

import com.reon.backend.global.ApiException;
import com.reon.backend.replay.entity.PlaylistExport;
import org.springframework.http.HttpStatus;

/** May include a partial playlist to let the user inspect the remote result. */
public class PlaylistCreationException extends ApiException {
    private final String playlistUrl;
    private final int confirmedTrackCount;
    public PlaylistCreationException(HttpStatus status, String code, String message, PlaylistExport export) {
        super(status, code, message);
        playlistUrl = export.getPlaylistId() == null ? null : "https://music.youtube.com/playlist?list=" + export.getPlaylistId();
        confirmedTrackCount = export.getTrackCount();
    }
    public String playlistUrl() { return playlistUrl; }
    public int confirmedTrackCount() { return confirmedTrackCount; }
}
