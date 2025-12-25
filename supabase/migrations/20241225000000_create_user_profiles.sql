-- Users Table Migration (Originally named user_profiles, renamed to users in 20241227000000)
-- 사용자 테이블 생성 (협업 및 사용자 정보 표시용)
-- Note: This table was renamed from user_profiles to users in a later migration

-- Users table (공개 사용자 정보)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT, -- 공개 이메일 (선택적)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기존 사용자들의 프로필 자동 생성 (auth.users의 metadata에서 가져오기)
-- 이 함수는 트리거에서 사용됨
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 생성 시 프로필 자동 생성 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 기존 사용자들의 프로필 생성 (이미 가입한 사용자들)
INSERT INTO public.user_profiles (id, display_name, avatar_url, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  raw_user_meta_data->>'avatar_url',
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 모든 사용자가 프로필 조회 가능
DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
CREATE POLICY "Anyone can view profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- 사용자는 자신의 프로필만 수정 가능
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 삽입 가능 (트리거로 자동 생성되지만 안전을 위해)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

