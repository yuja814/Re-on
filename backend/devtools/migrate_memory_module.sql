-- 기존 개발 서버를 중지한 뒤 Workbench 관리자 연결에서 전체 파일을 한 번 실행합니다.
-- 기존 memories / Moment / OAuth / playlist_exports 데이터는 삭제하지 않습니다.
USE reon_test;

-- Memory-owned tables only. User/Moment foreign keys are added after their schema exists.
CREATE TABLE IF NOT EXISTS reon_memory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    engine_memory_id VARCHAR(64) NOT NULL,
    period_month VARCHAR(7) NOT NULL,
    pattern_type VARCHAR(16) NOT NULL,
    title VARCHAR(512) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    moment_count INT NOT NULL,
    contexts_json LONGTEXT NOT NULL,
    tracks_json LONGTEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL,
    history_revision BIGINT NOT NULL,
    read_at DATETIME(6),
    version BIGINT NOT NULL,
    CONSTRAINT uk_reon_memory_engine UNIQUE (engine_memory_id),
    INDEX idx_memory_owner_active (user_id, active, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS reon_memory_moment (
    memory_id BIGINT NOT NULL,
    sort_index INT NOT NULL,
    moment_id BIGINT NOT NULL,
    recorded_at DATETIME(6) NOT NULL,
    song_title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    memo VARCHAR(2000),
    PRIMARY KEY (memory_id, sort_index),
    CONSTRAINT fk_memory_moment FOREIGN KEY (memory_id) REFERENCES reon_memory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS memory_history_revision (
    user_id BIGINT PRIMARY KEY,
    revision BIGINT NOT NULL,
    pending_months VARCHAR(2048) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Normalize tables created by a previous interrupted attempt to the Core database collation.
ALTER TABLE reon_memory CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE reon_memory_moment CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE memory_history_revision CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- This is a temporary migration helper only; dropping it never deletes application data.
DROP PROCEDURE IF EXISTS migrate_legacy_memory_20261015;
DELIMITER $$
CREATE PROCEDURE migrate_legacy_memory_20261015()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    IF EXISTS (SELECT 1 FROM memories old JOIN reon_memory target
        ON old.id = target.id OR BINARY old.engine_id = BINARY target.engine_memory_id
        WHERE old.id <> target.id OR BINARY old.engine_id <> BINARY target.engine_memory_id OR old.user_id <> target.user_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Memory ID conflict: migration stopped; inspect before retry';
    END IF;
    IF EXISTS (SELECT 1 FROM (
        SELECT user_id, COUNT(*) AS total FROM (
            SELECT user_id, period_month FROM memories
            UNION
            SELECT user_id, DATE_FORMAT(DATE_ADD(recorded_at, INTERVAL 9 HOUR), '%Y-%m') FROM moments
        ) months GROUP BY user_id HAVING COUNT(*) > 120
    ) exceeded) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'More than 120 pending months: migration stopped';
    END IF;
    -- Preserve public IDs and engine IDs. Rebuild content from current Moment data rather than stale snapshots.
    INSERT INTO reon_memory (id,user_id,engine_memory_id,period_month,pattern_type,title,description,
        start_date,end_date,moment_count,contexts_json,tracks_json,content_hash,active,history_revision,read_at,version)
    SELECT old.id,old.user_id,old.engine_id,old.period_month,'TIME','이전 Memory (재분석 대기)','현재 Moment로 다시 분석합니다.',
        STR_TO_DATE(CONCAT(old.period_month,'-01'),'%Y-%m-%d'),STR_TO_DATE(CONCAT(old.period_month,'-01'),'%Y-%m-%d'),
        0,'[]','[]',old.content_hash,FALSE,0,NULL,0
    FROM memories old WHERE NOT EXISTS (SELECT 1 FROM reon_memory target WHERE target.id=old.id);
    INSERT INTO memory_history_revision (user_id,revision,pending_months)
    SELECT user_id,1,GROUP_CONCAT(period_month ORDER BY period_month SEPARATOR ',')
    FROM (
        SELECT user_id,period_month FROM memories
        UNION
        SELECT user_id,DATE_FORMAT(DATE_ADD(recorded_at, INTERVAL 9 HOUR),'%Y-%m') FROM moments
    ) months GROUP BY user_id
    ON DUPLICATE KEY UPDATE revision=revision+1,pending_months=CASE WHEN pending_months='' THEN VALUES(pending_months) ELSE CONCAT(pending_months,',',VALUES(pending_months)) END;
    COMMIT;
END$$
DELIMITER ;
CALL migrate_legacy_memory_20261015();
DROP PROCEDURE migrate_legacy_memory_20261015;
SELECT id,user_id,engine_memory_id,period_month,active FROM reon_memory;
SELECT user_id,revision,pending_months FROM memory_history_revision;
