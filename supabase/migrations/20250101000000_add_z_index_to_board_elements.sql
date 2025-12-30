-- z_index 필드 추가
-- Add z_index field to board_elements table for depth management

DO $$ 
BEGIN
  -- z_index 필드 추가 (기본값: created_at 기반 인덱스)
  ALTER TABLE board_elements 
  ADD COLUMN IF NOT EXISTS z_index INTEGER;

  -- 기존 데이터의 z_index를 created_at 기반으로 설정
  -- created_at이 빠른 순서대로 0, 1, 2, ... 할당
  UPDATE board_elements 
  SET z_index = subquery.row_num - 1
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY board_id ORDER BY created_at ASC) as row_num
    FROM board_elements
  ) AS subquery
  WHERE board_elements.id = subquery.id
    AND board_elements.z_index IS NULL;

  -- 기본값을 0으로 설정 (새로 생성되는 요소는 0부터 시작)
  ALTER TABLE board_elements 
  ALTER COLUMN z_index SET DEFAULT 0;
END $$;

