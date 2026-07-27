-- ===============================================================================
-- Supabase Migration 006: เพิ่มคอลัมน์ password_hash ในตาราง users
-- ===============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text DEFAULT '';
