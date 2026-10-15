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
    @Column(name = "target_video_ids", length = org.hibernate.Length.LONG32) private String targetVideoIds;
    protected PlaylistExport() {}
    public PlaylistExport(Long userId, Long memoryId, String title) {
        this.userId = userId; this.memoryId = memoryId; this.title = title; this.status = "CREATING";
    }
    public void snapshot(java.util.List<String> ids) { this.targetVideoIds = String.join(",", ids); }
    public java.util.List<String> targetVideoIds() { return targetVideoIds == null ? java.util.List.of() : java.util.List.of(targetVideoIds.split(",", -1)); }
    public boolean isIncomplete() { return "INCOMPLETE".equals(status); }
    public void recovering() { this.status = "RECOVERING"; }
    public void reconciled(int count) { this.trackCount = count; }
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
