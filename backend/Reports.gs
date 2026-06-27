/**
 * Dashboard, ค้นหาทั้งระบบ, ประวัติการเคลื่อนไหว, ข้อมูลสำหรับ export
 */

function daysUntil_(dateStr) {
  if (!dateStr) return null;
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function bucketOf_(days, thresholds) {
  // thresholds = {red, orange, yellow}
  if (days === null) return 'green';
  if (days <= thresholds.red) return 'red';      // รวมที่หมดอายุแล้ว (days < 0)
  if (days <= thresholds.orange) return 'orange';
  if (days <= thresholds.yellow) return 'yellow';
  return 'green';
}

function getDashboard(locationId) {
  var settings = getSettings();
  var thresholds = {
    red: Number(settings.warnRed || 35),
    orange: Number(settings.warnOrange || 60),
    yellow: Number(settings.warnYellow || 120)
  };
  var meds = indexById_(readAll_('Medicines'));
  var locs = indexById_(readAll_('Locations'));
  var stock = readAll_('Stock').filter(function (s) {
    return Number(s.qty) > 0 && (!locationId || String(s.locationId) === String(locationId));
  });

  var buckets = { red: 0, orange: 0, yellow: 0, green: 0 };
  var items = [];
  stock.forEach(function (s) {
    var days = daysUntil_(s.expiryDate);
    var b = bucketOf_(days, thresholds);
    buckets[b] += 1;
    var m = meds[s.medicineId] || {};
    items.push({
      stockId: s.id, medicineId: s.medicineId, medicineName: m.name || '(ไม่พบยา)',
      barcode: String(m.barcode || ''), unit: m.unit || '',
      locationId: s.locationId, locationName: (locs[s.locationId] || {}).name || '',
      lot: s.lot, expiryDate: s.expiryDate, qty: Number(s.qty), daysLeft: days, bucket: b
    });
  });
  items.sort(function (a, b) {
    var da = a.daysLeft === null ? 999999 : a.daysLeft;
    var db = b.daysLeft === null ? 999999 : b.daysLeft;
    return da - db;
  });

  // สต็อกต่ำกว่าขั้นต่ำ (รวมยอดต่อยา ทั้งระบบหรือเฉพาะจุด)
  var totals = {};
  stock.forEach(function (s) {
    totals[s.medicineId] = (totals[s.medicineId] || 0) + Number(s.qty);
  });
  var lowStock = [];
  for (var mid in meds) {
    var min = Number(meds[mid].minStock || 0);
    if (min > 0) {
      var have = totals[mid] || 0;
      if (have < min) lowStock.push({ medicineId: mid, medicineName: meds[mid].name, have: have, minStock: min });
    }
  }

  // สรุปแยกตามสถานที่
  var perLocation = listLocations().map(function (l) {
    var locItems = items.filter(function (it) { return String(it.locationId) === String(l.id); });
    var lb = { red: 0, orange: 0, yellow: 0, green: 0 };
    var totalQty = 0;
    locItems.forEach(function (it) { lb[it.bucket] += 1; totalQty += it.qty; });
    return { id: l.id, name: l.name, icon: l.icon, color: l.color, lines: locItems.length, totalQty: totalQty, buckets: lb };
  });

  return { thresholds: thresholds, buckets: buckets, items: items, lowStock: lowStock, perLocation: perLocation };
}

function searchAll(query) {
  query = String(query || '').trim().toLowerCase();
  if (!query) return [];
  var meds = indexById_(readAll_('Medicines'));
  var locs = indexById_(readAll_('Locations'));
  return readAll_('Stock').filter(function (s) {
    if (Number(s.qty) <= 0) return false;
    var m = meds[s.medicineId] || {};
    var hay = [m.name, m.barcode, s.lot, (locs[s.locationId] || {}).name].join(' ').toLowerCase();
    return hay.indexOf(query) >= 0;
  }).map(function (s) {
    var m = meds[s.medicineId] || {};
    return {
      stockId: s.id, medicineId: s.medicineId, medicineName: m.name || '',
      barcode: String(m.barcode || ''), unit: m.unit || '',
      locationId: s.locationId, locationName: (locs[s.locationId] || {}).name || '',
      lot: s.lot, expiryDate: s.expiryDate, qty: Number(s.qty), daysLeft: daysUntil_(s.expiryDate)
    };
  });
}

function listMovements(filters) {
  var meds = indexById_(readAll_('Medicines'));
  var locs = indexById_(readAll_('Locations'));
  var users = indexById_(readAll_('Users'));
  var from = filters.from ? new Date(filters.from) : null;
  var to = filters.to ? new Date(filters.to + 'T23:59:59') : null;

  return readAll_('Movements').filter(function (mv) {
    if (filters.type && String(mv.type) !== String(filters.type)) return false;
    var t = new Date(mv.timestamp);
    if (from && t < from) return false;
    if (to && t > to) return false;
    return true;
  }).map(function (mv) {
    var m = meds[mv.medicineId] || {};
    return {
      id: mv.id, type: mv.type, medicineName: m.name || '',
      lot: mv.lot, expiryDate: mv.expiryDate,
      fromLocationName: (locs[mv.fromLocationId] || {}).name || '',
      toLocationName: (locs[mv.toLocationId] || {}).name || '',
      qty: Number(mv.qty), reason: mv.reason, source: mv.source || '',
      userName: (users[mv.userId] || {}).username || '', timestamp: mv.timestamp
    };
  }).sort(function (a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
}

/**
 * ข้อมูลดิบสำหรับ export (frontend แปลงเป็น .xlsx)
 * kind: 'receive' | 'movements' | 'stock'
 */
function exportRows(kind, filters) {
  if (kind === 'stock') {
    var rows = listStockByLocation('');
    var locs = indexById_(readAll_('Locations'));
    return {
      kind: kind,
      headers: ['ชื่อยา', 'บาร์โค้ด', 'สถานที่', 'Lot', 'วันหมดอายุ', 'คงเหลือ', 'หน่วย'],
      rows: rows.map(function (r) {
        return [r.medicineName, r.barcode, (locs[r.locationId] || {}).name || '', r.lot, r.expiryDate, r.qty, r.unit];
      })
    };
  }

  var movements = listMovements(filters || {});
  if (kind === 'receive') movements = movements.filter(function (m) { return m.type === 'receive'; });

  var typeLabel = { receive: 'รับเข้า', transfer: 'ย้าย', dispense: 'ตัดจ่าย/ทิ้ง', adjust: 'ปรับยอด' };
  return {
    kind: kind,
    headers: ['วันเวลา', 'ประเภท', 'ชื่อยา', 'Lot', 'วันหมดอายุ', 'จาก', 'ไป', 'จำนวน', 'แหล่งที่มา', 'หมายเหตุ', 'ผู้ทำ'],
    rows: movements.map(function (m) {
      return [m.timestamp, typeLabel[m.type] || m.type, m.medicineName, m.lot, m.expiryDate,
        m.fromLocationName, m.toLocationName, m.qty, m.source, m.reason, m.userName];
    })
  };
}
