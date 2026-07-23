-- ===============================================================================
-- ระบบจัดการคลังยา รพ.สต. — Supabase Migration 001: สร้างตาราง
-- ===============================================================================

-- 1) Settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text DEFAULT ''
);

-- 2) Users (เชื่อมกับ Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin','admin','pharmacist','staff')),
  full_name text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3) Locations (สถานที่เก็บยา)
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT 'map-pin',
  color text DEFAULT '#3b82f6',
  is_receiving_default boolean DEFAULT false,
  sort_order int DEFAULT 0
);

-- 4) Medicines (รายการยา)
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text DEFAULT '',
  unit text DEFAULT '',
  image_url text DEFAULT '',
  min_stock int DEFAULT 0,
  require_lot boolean DEFAULT false,
  default_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  jhcis_drug_code text DEFAULT ''
);

-- 5) Stock (สต็อกยา)
CREATE TABLE IF NOT EXISTS stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  lot text DEFAULT '',
  expiry_date date,
  qty int DEFAULT 0
);

-- 6) Movements (ประวัติเคลื่อนไหว)
CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('receive','dispense','transfer','adjust')),
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  lot text DEFAULT '',
  expiry_date date,
  from_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  to_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  qty int NOT NULL DEFAULT 0,
  reason text DEFAULT '',
  source text DEFAULT '',
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 7) Requisitions (ใบเบิกยา)
CREATE TABLE IF NOT EXISTS requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  req_number text NOT NULL UNIQUE,
  req_date date DEFAULT CURRENT_DATE,
  requester_name text DEFAULT '',
  approver_name text DEFAULT '',
  distributor_name text DEFAULT '',
  receiver_name text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','completed')),
  note text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 8) Requisition Items (รายการยาในใบเบิก)
CREATE TABLE IF NOT EXISTS requisition_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  qty_requested int DEFAULT 0,
  qty_approved int DEFAULT 0,
  qty_remaining int DEFAULT 0,
  note text DEFAULT ''
);

-- Indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_stock_medicine ON stock(medicine_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
CREATE INDEX IF NOT EXISTS idx_movements_medicine ON movements(medicine_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type);
CREATE INDEX IF NOT EXISTS idx_requisition_items_req ON requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('hospitalName', 'โรงพยาบาลส่งเสริมสุขภาพประจำตำบล'),
  ('logoUrl', ''),
  ('warnRed', '35'),
  ('warnOrange', '60'),
  ('warnYellow', '120'),
  ('telegramToken', ''),
  ('telegramChatId', ''),
  ('notifyTime', '08:00'),
  ('notifyEnabled', 'false')
ON CONFLICT (key) DO NOTHING;
