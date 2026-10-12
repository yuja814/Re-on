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
