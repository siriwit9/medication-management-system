#!/usr/bin/env python3
import urllib.request
import ssl
import csv
import io
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

SHEET_ID = '1EA-P2lljL48o4PyphqE4zZw8931JO7qlcXBZPLTV_2k'

def get_sheet_data(tab_name):
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={tab_name}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as resp:
        text = resp.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        return list(reader)

def escape_sql(val):
    if val is None:
        return 'NULL'
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

def main():
    print("Fetching Google Sheet data...")
    meds = get_sheet_data('Medicines')
    locs = get_sheet_data('Locations')
    stock = get_sheet_data('Stock')

    print(f"Loaded {len(locs)} locations, {len(meds)} medicines, {len(stock)} stock items.")

    sql_lines = [
        "-- ===============================================================================",
        "-- Supabase Migration 004: ปรับ RLS Policies ให้ public + นำเข้าข้อมูลจาก Google Sheets",
        "-- ===============================================================================",
        "",
        "-- 1) Update RLS Policies to public",
        "DROP POLICY IF EXISTS settings_read ON settings;",
        "DROP POLICY IF EXISTS settings_write ON settings;",
        "CREATE POLICY settings_read ON settings FOR SELECT TO public USING (true);",
        "CREATE POLICY settings_write ON settings FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS users_read ON users;",
        "DROP POLICY IF EXISTS users_write ON users;",
        "CREATE POLICY users_read ON users FOR SELECT TO public USING (true);",
        "CREATE POLICY users_write ON users FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS locations_read ON locations;",
        "DROP POLICY IF EXISTS locations_write ON locations;",
        "CREATE POLICY locations_read ON locations FOR SELECT TO public USING (true);",
        "CREATE POLICY locations_write ON locations FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS medicines_read ON medicines;",
        "DROP POLICY IF EXISTS medicines_write ON medicines;",
        "CREATE POLICY medicines_read ON medicines FOR SELECT TO public USING (true);",
        "CREATE POLICY medicines_write ON medicines FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS stock_read ON stock;",
        "DROP POLICY IF EXISTS stock_write ON stock;",
        "CREATE POLICY stock_read ON stock FOR SELECT TO public USING (true);",
        "CREATE POLICY stock_write ON stock FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS movements_read ON movements;",
        "DROP POLICY IF EXISTS movements_write ON movements;",
        "CREATE POLICY movements_read ON movements FOR SELECT TO public USING (true);",
        "CREATE POLICY movements_write ON movements FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS requisitions_read ON requisitions;",
        "DROP POLICY IF EXISTS requisitions_write ON requisitions;",
        "CREATE POLICY requisitions_read ON requisitions FOR SELECT TO public USING (true);",
        "CREATE POLICY requisitions_write ON requisitions FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS req_items_read ON requisition_items;",
        "DROP POLICY IF EXISTS req_items_write ON requisition_items;",
        "CREATE POLICY req_items_read ON requisition_items FOR SELECT TO public USING (true);",
        "CREATE POLICY req_items_write ON requisition_items FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS receipts_read ON receipts;",
        "DROP POLICY IF EXISTS receipts_write ON receipts;",
        "CREATE POLICY receipts_read ON receipts FOR SELECT TO public USING (true);",
        "CREATE POLICY receipts_write ON receipts FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "DROP POLICY IF EXISTS receipt_items_read ON receipt_items;",
        "DROP POLICY IF EXISTS receipt_items_write ON receipt_items;",
        "CREATE POLICY receipt_items_read ON receipt_items FOR SELECT TO public USING (true);",
        "CREATE POLICY receipt_items_write ON receipt_items FOR ALL TO public USING (true) WITH CHECK (true);",
        "",
        "-- 2) Insert Locations",
    ]

    for l in locs:
        l_id = escape_sql(l.get('id'))
        name = escape_sql(l.get('name'))
        icon = escape_sql(l.get('icon', 'map-pin'))
        color = escape_sql(l.get('color', '#3b82f6'))
        is_def = 'true' if str(l.get('isReceivingDefault')).upper() == 'TRUE' else 'false'
        sort_order = int(l.get('sortOrder') or 0)
        sql_lines.append(
            f"INSERT INTO locations (id, name, icon, color, is_receiving_default, sort_order) "
            f"VALUES ({l_id}, {name}, {icon}, {color}, {is_def}, {sort_order}) "
            f"ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, color = EXCLUDED.color, is_receiving_default = EXCLUDED.is_receiving_default, sort_order = EXCLUDED.sort_order;"
        )

    sql_lines.append("\n-- 3) Insert Medicines")
    for m in meds:
        m_id = escape_sql(m.get('id'))
        name = escape_sql(m.get('name'))
        barcode = escape_sql(m.get('barcode', ''))
        unit = escape_sql(m.get('unit', ''))
        min_stock = int(m.get('minStock') or 0)
        require_lot = 'true' if str(m.get('requireLot')).upper() == 'TRUE' else 'false'
        def_loc = escape_sql(m.get('defaultLocationId')) if m.get('defaultLocationId') else 'NULL'

        sql_lines.append(
            f"INSERT INTO medicines (id, name, barcode, unit, min_stock, require_lot, default_location_id) "
            f"VALUES ({m_id}, {name}, {barcode}, {unit}, {min_stock}, {require_lot}, {def_loc}) "
            f"ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, barcode = EXCLUDED.barcode, unit = EXCLUDED.unit, min_stock = EXCLUDED.min_stock, require_lot = EXCLUDED.require_lot, default_location_id = EXCLUDED.default_location_id;"
        )

    sql_lines.append("\n-- 4) Insert Stock")
    for s in stock:
        qty = int(s.get('qty') or 0)
        if qty <= 0:
            continue
        s_id = escape_sql(s.get('id'))
        med_id = escape_sql(s.get('medicineId'))
        loc_id = escape_sql(s.get('locationId'))
        lot = escape_sql(s.get('lot', ''))
        
        # parse expiry date
        raw_exp = s.get('expiryDate', '')
        exp_sql = 'NULL'
        if raw_exp:
            if '/' in raw_exp:
                parts = raw_exp.split('/')
                if len(parts) == 3:
                    exp_sql = escape_sql(f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}")
            else:
                exp_sql = escape_sql(raw_exp)

        qty = int(s.get('qty') or 0)
        sql_lines.append(
            f"INSERT INTO stock (id, medicine_id, location_id, lot, expiry_date, qty) "
            f"VALUES ({s_id}, {med_id}, {loc_id}, {lot}, {exp_sql}, {qty}) "
            f"ON CONFLICT (id) DO UPDATE SET qty = EXCLUDED.qty, lot = EXCLUDED.lot, expiry_date = EXCLUDED.expiry_date;"
        )

    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'supabase', 'migrations', '004_seed_google_sheets_data.sql')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Generated {output_path} ({len(sql_lines)} lines).")

if __name__ == '__main__':
    main()
