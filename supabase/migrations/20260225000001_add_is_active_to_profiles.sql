-- Add is_active column to profiles for soft delete / deactivation
ALTER TABLE profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
