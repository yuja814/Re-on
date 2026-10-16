-- Workbench 관리자 연결에서 기존 reon_test에 한 번 실행합니다.
USE reon_test;
ALTER TABLE playlist_exports ADD COLUMN target_video_ids LONGTEXT NULL;
-- 기존 완료된 결과는 유지됩니다. 기존 미완료 결과는 원본 목록이 없어 자동 복구하지 않습니다.
