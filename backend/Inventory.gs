/**
 * จัดการสต็อก: รับเข้า / ตัดจ่าย-ทิ้ง / ย้าย / ตรวจนับ
 * ทุกฟังก์ชันที่เขียนสต็อกครอบด้วย LockService กันยอดติดลบ (race condition)
 */

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function findStockRow_(rows, medicineId, locationId, lot, expiryDate) {
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.medicineId) === String(medicineId) &&
        String(r.locationId) === String(locationId) &&
        String(r.lot) === String(lot || '') &&
        String(r.expiryDate) === String(expiryDate || '')) {
      return r;
    }
  }
  return null;
}

function logMovement_(m) {
  appendRow_('Movements', {
    id: Utilities.getUuid(),
    type: m.type,
    medicineId: m.medicineId || '',
    lot: m.lot || '',
    expiryDate: m.expiryDate || '',
    fromLocationId: m.fromLocationId || '',
    toLocationId: m.toLocationId || '',
    qty: m.qty,
    reason: m.reason || '',
    userId: m.userId || '',
    timestamp: new Date().toISOString()
  });
}

// ===== รับเข้า =====
function receiveStock(p, user) {
  if (!p || !p.medicineId || !p.locationId) throw new Error('ข้อมูลรับเข้าไม่ครบ');
  var qty = Number(p.qty);
  if (!(qty > 0)) throw new Error('จำนวนต้องมากกว่า 0');

  var med = findById_('Medicines', p.medicineId);
  if (!med) throw new Error('ไม่พบรายการยา');
  if (String(med.requireLot) === 'true' && (!p.lot || !p.expiryDate)) {
    throw new Error('รายการนี้ต้องระบุ Lot และวันหมดอายุ');
  }

  return withLock_(function () {
    var stock = readAll_('Stock');
    var existing = findStockRow_(stock, p.medicineId, p.locationId, p.lot, p.expiryDate);
    if (existing) {
      existing.qty = Number(existing.qty) + qty;
      updateRow_('Stock', existing.__row, existing);
    } else {
      appendRow_('Stock', {
        id: Utilities.getUuid(), medicineId: p.medicineId, locationId: p.locationId,
        lot: p.lot || '', expiryDate: p.expiryDate || '', qty: qty
      });
    }
    logMovement_({ type: 'receive', medicineId: p.medicineId, lot: p.lot, expiryDate: p.expiryDate,
      toLocationId: p.locationId, qty: qty, reason: p.reason || '', userId: user.id });
    return { received: qty };
  });
}

// ===== ตัดจ่าย / ทิ้ง =====
function dispenseStock(p, user) {
  if (!p || !p.stockId) throw new Error('ไม่พบรายการสต็อก');
  var qty = Number(p.qty);
  if (!(qty > 0)) throw new Error('จำนวนต้องมากกว่า 0');
  var reason = ['dispense', 'expired', 'damaged'].indexOf(p.reason) >= 0 ? p.reason : 'dispense';

  return withLock_(function () {
    var row = findById_('Stock', p.stockId);
    if (!row) throw new Error('ไม่พบรายการสต็อก');
    if (Number(row.qty) < qty) throw new Error('จำนวนคงเหลือไม่พอ (มี ' + row.qty + ')');
    row.qty = Number(row.qty) - qty;
    if (row.qty === 0) {
      deleteRowByMatch_('Stock', function (s) { return String(s.id) === String(row.id); });
    } else {
      updateRow_('Stock', row.__row, row);
    }
    logMovement_({ type: 'dispense', medicineId: row.medicineId, lot: row.lot, expiryDate: row.expiryDate,
      fromLocationId: row.locationId, qty: qty, reason: reason, userId: user.id });
    return { dispensed: qty };
  });
}

// ===== ย้าย / แลกยา =====
function transferStock(p, user) {
  if (!p || !p.stockId || !p.toLocationId) throw new Error('ข้อมูลการย้ายไม่ครบ');
  var qty = Number(p.qty);
  if (!(qty > 0)) throw new Error('จำนวนต้องมากกว่า 0');

  return withLock_(function () {
    var src = findById_('Stock', p.stockId);
    if (!src) throw new Error('ไม่พบรายการสต็อกต้นทาง');
    if (String(src.locationId) === String(p.toLocationId)) throw new Error('สถานที่ปลายทางต้องต่างจากต้นทาง');
    if (Number(src.qty) < qty) throw new Error('จำนวนคงเหลือไม่พอ (มี ' + src.qty + ')');

    // ลดต้นทาง
    src.qty = Number(src.qty) - qty;
    if (src.qty === 0) {
      deleteRowByMatch_('Stock', function (s) { return String(s.id) === String(src.id); });
    } else {
      updateRow_('Stock', src.__row, src);
    }

    // เพิ่มปลายทาง (รวม lot ถ้าตรงกัน) — อ่านใหม่หลังลบ
    var stock = readAll_('Stock');
    var dest = findStockRow_(stock, src.medicineId, p.toLocationId, src.lot, src.expiryDate);
    if (dest) {
      dest.qty = Number(dest.qty) + qty;
      updateRow_('Stock', dest.__row, dest);
    } else {
      appendRow_('Stock', {
        id: Utilities.getUuid(), medicineId: src.medicineId, locationId: p.toLocationId,
        lot: src.lot, expiryDate: src.expiryDate, qty: qty
      });
    }
    logMovement_({ type: 'transfer', medicineId: src.medicineId, lot: src.lot, expiryDate: src.expiryDate,
      fromLocationId: src.locationId, toLocationId: p.toLocationId, qty: qty, userId: user.id });
    return { transferred: qty };
  });
}

// ===== ตรวจนับ (ปรับยอด) =====
function adjustCount(p, user) {
  if (!p || !p.stockId) throw new Error('ไม่พบรายการสต็อก');
  var actual = Number(p.actualQty);
  if (!(actual >= 0)) throw new Error('จำนวนจริงต้องไม่ติดลบ');

  return withLock_(function () {
    var row = findById_('Stock', p.stockId);
    if (!row) throw new Error('ไม่พบรายการสต็อก');
    var diff = actual - Number(row.qty);
    if (diff === 0) return { adjusted: 0 };
    if (actual === 0) {
      deleteRowByMatch_('Stock', function (s) { return String(s.id) === String(row.id); });
    } else {
      row.qty = actual;
      updateRow_('Stock', row.__row, row);
    }
    logMovement_({ type: 'adjust', medicineId: row.medicineId, lot: row.lot, expiryDate: row.expiryDate,
      fromLocationId: row.locationId, qty: diff, reason: p.reason || 'ตรวจนับสต็อก', userId: user.id });
    return { adjusted: diff };
  });
}

// ===== อ่านสต็อกตามสถานที่ (พร้อมข้อมูลยา) =====
function listStockByLocation(locationId) {
  var meds = indexById_(readAll_('Medicines'));
  var stock = readAll_('Stock').filter(function (s) {
    return !locationId || String(s.locationId) === String(locationId);
  });
  return stock.map(function (s) {
    var m = meds[s.medicineId] || {};
    return {
      stockId: s.id, medicineId: s.medicineId, medicineName: m.name || '(ไม่พบยา)',
      barcode: m.barcode || '', unit: m.unit || '', locationId: s.locationId,
      lot: s.lot, expiryDate: s.expiryDate, qty: Number(s.qty), minStock: Number(m.minStock || 0)
    };
  }).sort(function (a, b) { return String(a.expiryDate).localeCompare(String(b.expiryDate)); });
}

function indexById_(rows) {
  var map = {};
  rows.forEach(function (r) { map[r.id] = r; });
  return map;
}
