#!/usr/bin/env python3
import urllib.request
import ssl
import csv
import io
import json
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

def main():
    print("Fetching Google Sheet data for JS seed...")
    meds = get_sheet_data('Medicines')
    locs = get_sheet_data('Locations')
    stock = get_sheet_data('Stock')

    formatted_locs = [
        {
            'id': l['id'],
            'name': l['name'],
            'icon': l.get('icon') or 'map-pin',
            'color': l.get('color') or '#3b82f6',
            'isReceivingDefault': str(l.get('isReceivingDefault')).upper() == 'TRUE',
            'sortOrder': int(l.get('sortOrder') or 0)
        }
        for l in locs
    ]

    formatted_meds = [
        {
            'id': m['id'],
            'name': m['name'],
            'barcode': m.get('barcode') or '',
            'unit': m.get('unit') or '',
            'minStock': int(m.get('minStock') or 0),
            'requireLot': str(m.get('requireLot')).upper() == 'TRUE',
            'defaultLocationId': m.get('defaultLocationId') or ''
        }
        for m in meds
    ]

    formatted_stock = []
    for s in stock:
        raw_exp = s.get('expiryDate', '')
        exp = ''
        if raw_exp:
            if '/' in raw_exp:
                parts = raw_exp.split('/')
                if len(parts) == 3:
                    exp = f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}"
            else:
                exp = raw_exp
        formatted_stock.append({
            'id': s['id'],
            'medicineId': s['medicineId'],
            'locationId': s['locationId'],
            'lot': s.get('lot') or '',
            'expiryDate': exp,
            'qty': int(s.get('qty') or 0)
        })

    js_content = f"""/**
 * Google Sheet Seed Data (140 รายการยา + 4 สถานที่ + สต็อก)
 * ดึงจาก: https://docs.google.com/spreadsheets/d/{SHEET_ID}
 */
window.GOOGLE_SHEET_SEED = {{
  sheetId: '{SHEET_ID}',
  locations: {json.dumps(formatted_locs, ensure_ascii=False, indent=2)},
  medicines: {json.dumps(formatted_meds, ensure_ascii=False, indent=2)},
  stock: {json.dumps(formatted_stock, ensure_ascii=False, indent=2)}
}};
"""

    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'assets', 'js', 'google-sheet-seed.js')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Wrote {out_path} with {len(formatted_meds)} medicines.")

if __name__ == '__main__':
    main()
