-- ===============================================================================
-- ระบบจัดการคลังยา รพ.สต. — Supabase Migration 003: ใบเสร็จ และ JHCIS Sync
-- ===============================================================================

-- 1) Receipts (ตารางใบเสร็จ/ใบจ่ายยา)
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  receipt_date date DEFAULT CURRENT_DATE,
  patient_hn text DEFAULT '',
  patient_name text DEFAULT '',
  privilege text DEFAULT 'ทั่วไป', -- สิทธิการรักษา (เช่น 30 บาท, เบิกได้)
  total_amount numeric(10,2) DEFAULT 0.00,
  dispenser_name text DEFAULT '',
  status text DEFAULT 'completed' CHECK (status IN ('completed','cancelled')),
  note text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2) Receipt Items (รายการยาในใบเสร็จ)
CREATE TABLE IF NOT EXISTS receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  medicine_name text DEFAULT '',
  lot text DEFAULT '',
  expiry_date date,
  qty int DEFAULT 1,
  price_per_unit numeric(10,2) DEFAULT 0.00,
  total_price numeric(10,2) DEFAULT 0.00,
  note text DEFAULT ''
);

-- 3) JHCIS Imports Log (ประวัตินำเข้าจาก JHCIS)
CREATE TABLE IF NOT EXISTS jhcis_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text DEFAULT '',
  imported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  total_records int DEFAULT 0,
  matched_records int DEFAULT 0,
  created_records int DEFAULT 0,
  updated_records int DEFAULT 0,
  imported_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_medicine ON receipt_items(medicine_id);

-- RLS Policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jhcis_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_read" ON receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "receipts_write" ON receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "receipt_items_read" ON receipt_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "receipt_items_write" ON receipt_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "jhcis_imports_read" ON jhcis_imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "jhcis_imports_write" ON jhcis_imports FOR ALL TO authenticated USING (true) WITH CHECK (true);
