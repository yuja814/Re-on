-- Execute using the administrator connection in MySQL Workbench.
USE reon_test;

-- Apply once to the configured MySQL database before starting the mysql profile.
CREATE TABLE IF NOT EXISTS reon_users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    google_subject VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    profile_image_url VARCHAR(2048),
    CONSTRAINT uk_reon_users_google_subject UNIQUE (google_subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_auth_session_user FOREIGN KEY (user_id) REFERENCES reon_users(id),
    INDEX idx_auth_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS moments (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    video_id VARCHAR(11) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    title VARCHAR(512) NOT NULL,
    channel_title VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(2048),
    memo VARCHAR(2000) NOT NULL,
    recorded_at DATETIME(6) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_moment_user FOREIGN KEY (user_id) REFERENCES reon_users(id),
    INDEX idx_moments_user_recorded_id (user_id, recorded_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS youtube_authorizations (
    user_id BIGINT PRIMARY KEY,
    state_hash VARCHAR(64) NOT NULL,
    encrypted_verifier VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_youtube_authorization_user FOREIGN KEY (user_id) REFERENCES reon_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS youtube_connections (
    user_id BIGINT PRIMARY KEY,
    encrypted_access_token VARCHAR(8192) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    encrypted_refresh_token VARCHAR(8192) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    reauth_required BOOLEAN NOT NULL,
    CONSTRAINT fk_youtube_connection_user FOREIGN KEY (user_id) REFERENCES reon_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS playlist_exports (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    memory_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    playlist_id VARCHAR(128),
    target_video_ids LONGTEXT,
    track_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT fk_playlist_export_user FOREIGN KEY (user_id) REFERENCES reon_users(id),
    CONSTRAINT uk_playlist_export_memory UNIQUE (user_id, memory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS memories (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    engine_id VARCHAR(64) NOT NULL,
    period_month VARCHAR(7) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    snapshot LONGTEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    CONSTRAINT fk_memory_user FOREIGN KEY (user_id) REFERENCES reon_users(id),
    CONSTRAINT uk_memory_engine UNIQUE(user_id, engine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
