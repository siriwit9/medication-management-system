-- ===============================================================================
-- Supabase Migration 005: เพิ่มคอลัมน์ from_location_id ในตาราง requisitions
-- ===============================================================================

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS from_location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
