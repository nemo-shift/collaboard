-- Set REPLICA IDENTITY FULL for board_elements table
-- This ensures that DELETE events include the full old row data in payload.old
-- Required for Supabase Realtime to send complete deleted row information

ALTER TABLE board_elements REPLICA IDENTITY FULL;

-- Verify the setting
-- SELECT relreplident FROM pg_class WHERE relname = 'board_elements';
-- relreplident = 'f' means FULL (0=DEFAULT, 1=NOTHING, 2=INDEX, 3=FULL)
-- 'f' = 3 = FULL

