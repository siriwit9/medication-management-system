#!/usr/bin/env python3
import urllib.request
import ssl
import json
import csv
import io

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

SHEET_ID = '1EA-P2lljL48o4PyphqE4zZw8931JO7qlcXBZPLTV_2k'
SUPABASE_URL = 'https://okcctrkxsuhgjvitwaus.supabase.co'
SUPABASE_KEY = 'sb_publishable_Jbk3rrBV6uUi0zIX2T03rw_SxboQ6TN'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

def get_sheet_data(tab_name):
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={tab_name}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as resp:
        text = resp.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        return list(reader)

def post_supabase(table, data):
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"Error posting to {table}: {err_msg}")
        return e.code

def main():
    print("Fetching Google Sheet data...")
    locs = get_sheet_data('Locations')
    meds = get_sheet_data('Medicines')
    stock = get_sheet_data('Stock')

    print(f"Importing {len(locs)} locations...")
    loc_payload = [
        {
            'id': l['id'],
            'name': l['name'],
            'icon': l.get('icon') or 'map-pin',
            'color': l.get('color') or '#3b82f6',
            'is_receiving_default': str(l.get('isReceivingDefault')).upper() == 'TRUE',
            'sort_order': int(l.get('sortOrder') or 0)
        }
        for l in locs
    ]
    post_supabase('locations', loc_payload)

    print(f"Importing {len(meds)} medicines...")
    med_payload = []
    for m in meds:
        med_payload.append({
            'id': m['id'],
            'name': m['name'],
            'barcode': m.get('barcode') or '',
            'unit': m.get('unit') or '',
            'min_stock': int(m.get('minStock') or 0),
            'require_lot': str(m.get('requireLot')).upper() == 'TRUE',
            'default_location_id': m.get('defaultLocationId') if m.get('defaultLocationId') else None
        })
    # Batch in chunks of 50
    for i in range(0, len(med_payload), 50):
        chunk = med_payload[i:i+50]
        st = post_supabase('medicines', chunk)
        print(f"  Medicines chunk {i//50 + 1}: status {st}")

    print(f"Importing {len(stock)} stock items...")
    stock_payload = []
    for s in stock:
        raw_exp = s.get('expiryDate', '')
        exp = None
        if raw_exp:
            if '/' in raw_exp:
                parts = raw_exp.split('/')
                if len(parts) == 3:
                    exp = f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}"
            else:
                exp = raw_exp

        stock_payload.append({
            'id': s['id'],
            'medicine_id': s['medicineId'],
            'location_id': s['locationId'],
            'lot': s.get('lot') or '',
            'expiry_date': exp,
            'qty': int(s.get('qty') or 0)
        })
    post_supabase('stock', stock_payload)

    print("Done importing into Supabase!")

if __name__ == '__main__':
    main()
