-- Add the is_active column to the buckets table to track their status.
-- Defaults to TRUE so existing buckets are considered active.
ALTER TABLE buckets
ADD COLUMN is_active BOOLEAN DEFAULT true;
