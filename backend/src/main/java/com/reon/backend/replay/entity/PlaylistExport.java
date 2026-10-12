package com.reon.backend.replay.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "playlist_exports", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "memory_id"}))
public class PlaylistExport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "memory_id", nullable = false) private Long memoryId;
    @Column(nullable = false, length = 150) private String title;
    @Column(name = "playlist_id", length = 128) private String playlistId;
    @Column(name = "track_count", nullable = false) private int trackCount;
    @Column(nullable = false, length = 20) private String status;
    protected PlaylistExport() {}
    public PlaylistExport(Long userId, Long memoryId, String title) {
        this.userId = userId; this.memoryId = memoryId; this.title = title; this.status = "CREATING";
    }
    public void created(String playlistId) { this.playlistId = playlistId; }
    public void trackAdded() { this.trackCount++; }
    public void complete() { this.status = "COMPLETED"; }
    public void fail() { this.status = "INCOMPLETE"; }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getPlaylistId() { return playlistId; }
    public int getTrackCount() { return trackCount; }
    public boolean isCompleted() { return "COMPLETED".equals(status); }
}
