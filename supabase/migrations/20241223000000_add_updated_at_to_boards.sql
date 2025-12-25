-- Add updated_at column to boards table
ALTER TABLE boards 
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update existing rows to set updated_at = created_at
UPDATE boards 
SET updated_at = created_at 
WHERE updated_at IS NULL OR updated_at < created_at;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on board updates
CREATE TRIGGER update_boards_updated_at 
BEFORE UPDATE ON boards 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

