-- 보드에 초대코드 필드 추가
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 초대코드 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_boards_invite_code ON boards(invite_code);

-- 초대코드 생성 함수 (8자리 랜덤 문자열)
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 기존 public 보드에 초대코드 자동 생성
UPDATE boards 
SET invite_code = generate_invite_code()
WHERE is_public = true AND invite_code IS NULL;

