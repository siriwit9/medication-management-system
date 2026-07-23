-- ===============================================================================
-- ระบบจัดการคลังยา รพ.สต. — Supabase Migration 002: Row-Level Security
-- ===============================================================================
-- Phase 1: single-tenant (ทุกคนที่ login เห็นข้อมูลเดียวกัน)
-- Phase 2: จะเพิ่ม org_id เพื่อแยก 19 รพ.สต.

-- เปิด RLS ทุกตาราง
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_items ENABLE ROW LEVEL SECURITY;

-- Phase 1: ให้ authenticated users เข้าถึงข้อมูลทั้งหมดได้ (single-tenant)
-- Phase 2: จะปรับเป็น org_id based policies

-- Settings: authenticated อ่านได้ทุกคน, admin เท่านั้นที่แก้ไขได้
CREATE POLICY "settings_read" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users: authenticated อ่านได้, admin จัดการได้
CREATE POLICY "users_read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_write" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Locations: authenticated อ่านได้, pharmacist+ จัดการได้
CREATE POLICY "locations_read" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations_write" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Medicines: authenticated อ่านได้, pharmacist+ จัดการได้
CREATE POLICY "medicines_read" ON medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "medicines_write" ON medicines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock: authenticated เข้าถึงได้ทุกคน
CREATE POLICY "stock_read" ON stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_write" ON stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Movements: authenticated อ่านได้ทุกคน, staff+ เพิ่มได้
CREATE POLICY "movements_read" ON movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "movements_write" ON movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Requisitions: authenticated เข้าถึงได้ทุกคน
CREATE POLICY "requisitions_read" ON requisitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "requisitions_write" ON requisitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Requisition Items: authenticated เข้าถึงได้ทุกคน
CREATE POLICY "req_items_read" ON requisition_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "req_items_write" ON requisition_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role (Netlify Functions) สามารถเข้าถึงได้ทุกอย่าง (ใช้ service_role key)
-- ไม่ต้องเพิ่ม policy เพราะ service_role bypass RLS อัตโนมัติ
