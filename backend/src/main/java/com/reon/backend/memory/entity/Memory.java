package com.reon.backend.memory.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "memories", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "engine_id"}))
public class Memory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "engine_id", nullable = false, length = 64) private String engineId;
    @Column(name = "period_month", nullable = false, length = 7) private String periodMonth;
    @Column(name = "content_hash", nullable = false, length = 64) private String contentHash;
    @Column(nullable = false, length = org.hibernate.Length.LONG32) private String snapshot;
    @Column(name = "is_active", nullable = false) private boolean active;
    protected Memory() {}
    public Memory(Long userId, String engineId, String periodMonth) { this.userId = userId; this.engineId = engineId; this.periodMonth = periodMonth; }
    public void apply(String contentHash, String snapshot) { this.contentHash = contentHash; this.snapshot = snapshot; this.active = true; }
    public void deactivate() { this.active = false; }
    public Long getId() { return id; }
    public String getEngineId() { return engineId; }
    public String getPeriodMonth() { return periodMonth; }
    public String getContentHash() { return contentHash; }
    public String getSnapshot() { return snapshot; }
    public boolean isActive() { return active; }
}
