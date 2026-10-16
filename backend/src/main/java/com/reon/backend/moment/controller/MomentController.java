package com.reon.backend.moment.controller;

import com.reon.backend.moment.dto.*;
import com.reon.backend.moment.service.MomentService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/moments")
public class MomentController {
    private final MomentService service;
    public MomentController(MomentService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<MomentResponse> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody MomentCreateRequest request) {
        var result = service.create(authorization, request);
        return ResponseEntity.created(java.net.URI.create("/api/v1/moments/" + result.id()))
                .cacheControl(CacheControl.noStore()).body(result);
    }

    @GetMapping
    public ResponseEntity<MomentListResponse> list(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) Integer year, @RequestParam(required = false) Integer month,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String cursor) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.list(authorization, year, month, size, cursor));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MomentResponse> detail(
            @RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.detail(authorization, id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MomentUpdateResponse> update(
            @RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable Long id,
            @Valid @RequestBody MomentUpdateRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.update(authorization, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable Long id) {
        service.delete(authorization, id);
        return ResponseEntity.noContent().build();
    }
}
