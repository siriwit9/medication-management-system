/**
 * โครงสร้างคลัง: สถานที่เก็บยา (Locations) + รายการยา (Medicines)
 */

// ===== Locations =====
function listLocations() {
  return readAll_('Locations').map(function (l) {
    return {
      id: l.id, name: l.name, icon: l.icon, color: l.color,
      isReceivingDefault: String(l.isReceivingDefault) === 'true',
      sortOrder: Number(l.sortOrder || 0)
    };
  }).sort(function (a, b) { return a.sortOrder - b.sortOrder; });
}

function saveLocation(loc, user) {
  if (!loc || !loc.name) throw new Error('ต้องระบุชื่อสถานที่');

  // ถ้าตั้งเป็นจุดเริ่มต้นรับเข้า ให้ยกเลิกของเดิม
  if (loc.isReceivingDefault) {
    var sh = getSheet_('Locations');
    readAll_('Locations').forEach(function (r) {
      if (String(r.isReceivingDefault) === 'true' && String(r.id) !== String(loc.id)) {
        sh.getRange(r.__row, 5).setValue('false');
      }
    });
  }

  if (loc.id) {
    var existing = findById_('Locations', loc.id);
    if (!existing) throw new Error('ไม่พบสถานที่');
    existing.name = loc.name;
    existing.icon = loc.icon || existing.icon || 'package';
    existing.color = loc.color || existing.color || '#2563eb';
    existing.isReceivingDefault = loc.isReceivingDefault ? 'true' : 'false';
    updateRow_('Locations', existing.__row, existing);
    return { id: existing.id };
  }

  var rows = readAll_('Locations');
  var maxOrder = rows.reduce(function (mx, r) { return Math.max(mx, Number(r.sortOrder || 0)); }, 0);
  var id = Utilities.getUuid();
  appendRow_('Locations', {
    id: id, name: loc.name, icon: loc.icon || 'package', color: loc.color || '#2563eb',
    isReceivingDefault: loc.isReceivingDefault ? 'true' : 'false', sortOrder: String(maxOrder + 1)
  });
  return { id: id };
}

function deleteLocation(id, user) {
  var stock = readAll_('Stock').filter(function (s) { return String(s.locationId) === String(id) && Number(s.qty) > 0; });
  if (stock.length > 0) throw new Error('ยังมียาในสถานที่นี้ ไม่สามารถลบได้');
  deleteRowByMatch_('Locations', function (l) { return String(l.id) === String(id); });
  return { deleted: true };
}

function reorderLocations(orderedIds, user) {
  if (!orderedIds || !orderedIds.length) return { reordered: 0 };
  var sh = getSheet_('Locations');
  var rows = readAll_('Locations');
  var byId = {};
  rows.forEach(function (r) { byId[r.id] = r; });
  orderedIds.forEach(function (id, idx) {
    if (byId[id]) sh.getRange(byId[id].__row, 6).setValue(String(idx + 1));
  });
  return { reordered: orderedIds.length };
}

// ===== Medicines =====
function listMedicines() {
  return readAll_('Medicines').map(function (m) {
    return {
      id: m.id, name: m.name, barcode: String(m.barcode || ''), unit: m.unit || '',
      imageFileId: m.imageFileId || '', minStock: Number(m.minStock || 0),
      requireLot: String(m.requireLot) === 'true', defaultLocationId: m.defaultLocationId || ''
    };
  }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'th'); });
}

function saveMedicine(med, user) {
  if (!med || !med.name) throw new Error('ต้องระบุชื่อยา');

  // กันบาร์โค้ดซ้ำ
  if (med.barcode) {
    var dup = readAll_('Medicines').filter(function (m) {
      return String(m.barcode) === String(med.barcode) && String(m.id) !== String(med.id || '');
    });
    if (dup.length > 0) throw new Error('บาร์โค้ดนี้ถูกใช้แล้ว');
  }

  if (med.id) {
    var existing = findById_('Medicines', med.id);
    if (!existing) throw new Error('ไม่พบรายการยา');
    existing.name = med.name;
    existing.barcode = med.barcode || '';
    existing.unit = med.unit || '';
    existing.minStock = String(Number(med.minStock || 0));
    existing.requireLot = med.requireLot ? 'true' : 'false';
    existing.defaultLocationId = med.defaultLocationId || '';
    if (med.imageFileId !== undefined) existing.imageFileId = med.imageFileId;
    updateRow_('Medicines', existing.__row, existing);
    return { id: existing.id };
  }

  var id = Utilities.getUuid();
  appendRow_('Medicines', {
    id: id, name: med.name, barcode: med.barcode || '', unit: med.unit || '',
    imageFileId: med.imageFileId || '', minStock: String(Number(med.minStock || 0)),
    requireLot: med.requireLot ? 'true' : 'false', defaultLocationId: med.defaultLocationId || ''
  });
  return { id: id };
}

function deleteMedicine(id, user) {
  var stock = readAll_('Stock').filter(function (s) { return String(s.medicineId) === String(id) && Number(s.qty) > 0; });
  if (stock.length > 0) throw new Error('ยังมีสต็อกของยานี้ ไม่สามารถลบได้');
  var med = findById_('Medicines', id);
  if (med && med.imageFileId) { try { deleteDriveFile_(med.imageFileId); } catch (e) {} }
  deleteRowByMatch_('Medicines', function (m) { return String(m.id) === String(id); });
  return { deleted: true };
}
