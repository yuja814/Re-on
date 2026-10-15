package com.reon.backend.global;

import org.springframework.http.ResponseEntity;
import com.reon.backend.replay.service.PlaylistCreationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ErrorResponse(String code, String message) {}

    public record PlaylistError(String code, String message, String playlistUrl, int confirmedTrackCount) {}

    @ExceptionHandler(PlaylistCreationException.class)
    public ResponseEntity<PlaylistError> handlePlaylist(PlaylistCreationException exception) {
        return ResponseEntity.status(exception.status()).body(new PlaylistError(exception.code(), exception.getMessage(),
                exception.playlistUrl(), exception.confirmedTrackCount()));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.status())
                .body(new ErrorResponse(exception.code(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_REQUEST",
                exception.getBindingResult().getFieldErrors().getFirst().getDefaultMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch() {
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_REQUEST", "경로 또는 조회 조건의 형식이 올바르지 않습니다."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataConflict() {
        return ResponseEntity.status(409).body(new ErrorResponse("DATA_CONFLICT", "요청이 충돌했습니다. 다시 시도해주세요."));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleInvalidJson() {
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_REQUEST", "올바른 JSON 요청이 필요합니다."));
    }
}
