package com.reon.backend.moment.entity;

import com.reon.backend.music.dto.MusicResolveResponse;
import com.reon.backend.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "moments", indexes = @Index(name = "idx_moments_user_recorded_id", columnList = "user_id,recorded_at,id"))
public class Moment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "video_id", nullable = false, length = 11)
    private String videoId;
    @Column(nullable = false, length = 512)
    private String title;
    @Column(name = "channel_title", nullable = false, length = 255)
    private String channelTitle;
    @Column(name = "thumbnail_url", length = 2048)
    private String thumbnailUrl;
    @Column(nullable = false, length = 2000)
    private String memo;
    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
    private Double latitude;
    private Double longitude;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Moment() {}

    public Moment(User user, MusicResolveResponse music, String memo, Instant recordedAt, Double latitude, Double longitude) {
        this.user = user;
        this.videoId = music.videoId();
        this.title = music.title();
        this.channelTitle = music.channelTitle();
        this.thumbnailUrl = music.thumbnailUrl();
        this.memo = memo == null ? "" : memo;
        // Match database precision so the cursor equals the stored timestamp.
        this.recordedAt = recordedAt.truncatedTo(ChronoUnit.MICROS);
        this.latitude = latitude;
        this.longitude = longitude;
        this.updatedAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public void updateMemo(String memo) {
        this.memo = memo;
        this.updatedAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public Long getId() { return id; }
    public String getVideoId() { return videoId; }
    public String getTitle() { return title; }
    public String getChannelTitle() { return channelTitle; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getMemo() { return memo; }
    public Instant getRecordedAt() { return recordedAt; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Instant getUpdatedAt() { return updatedAt; }
}
