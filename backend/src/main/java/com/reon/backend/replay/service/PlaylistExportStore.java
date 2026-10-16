package com.reon.backend.replay.service;

import com.reon.backend.replay.entity.PlaylistExport;
import com.reon.backend.replay.repository.PlaylistExportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class PlaylistExportStore {
    private final PlaylistExportRepository exports;
    public PlaylistExportStore(PlaylistExportRepository exports) { this.exports = exports; }
    @Transactional(readOnly = true)
    public Optional<PlaylistExport> find(Long userId, Long memoryId) { return exports.findByUserIdAndMemoryId(userId, memoryId); }
    @Transactional
    public PlaylistExport begin(Long userId, Long memoryId, String title) { return exports.saveAndFlush(new PlaylistExport(userId, memoryId, title)); }
    @Transactional
    public PlaylistExport begin(Long userId, Long memoryId, String title, java.util.List<String> ids) {
        var export = new PlaylistExport(userId, memoryId, title); export.snapshot(ids); return exports.saveAndFlush(export);
    }
    @Transactional
    public PlaylistExport claimRecovery(Long userId, Long memoryId) {
        var export = exports.lockOwned(userId, memoryId).orElseThrow(() -> new com.reon.backend.global.ApiException(
                org.springframework.http.HttpStatus.NOT_FOUND, "PLAYLIST_EXPORT_NOT_FOUND", "생성 이력이 없습니다."));
        if (export.isCompleted()) { return export; }
        if (!export.isIncomplete() || export.getPlaylistId() == null || export.targetVideoIds().isEmpty()) {
            throw new PlaylistCreationException(org.springframework.http.HttpStatus.CONFLICT, "PLAYLIST_RECOVERY_BLOCKED",
                    "생성 중이거나 원본 곡 목록 또는 플레이리스트 ID가 없어 자동 복구할 수 없습니다.", export);
        }
        export.recovering(); return export;
    }
    @Transactional
    public void reconciled(Long id, int count) { exports.findById(id).orElseThrow().reconciled(count); }
    @Transactional
    public void created(Long id, String playlistId) { exports.findById(id).orElseThrow().created(playlistId); }
    @Transactional
    public void trackAdded(Long id) { exports.findById(id).orElseThrow().trackAdded(); }
    @Transactional
    public PlaylistExport complete(Long id) {
        var export = exports.findById(id).orElseThrow(); export.complete(); return export;
    }
    @Transactional
    public void failed(Long id) { exports.findById(id).orElseThrow().fail(); }
}
