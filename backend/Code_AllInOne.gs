/**
 * ================================================================================
 * ระบบจัดการคลังยา รพ.สต. — Google Apps Script (รวมทุกไฟล์เป็นไฟล์เดียว)
 * ================================================================================
 * วิธีใช้:
 *   1. เปิด Google Sheets → ส่วนขยาย → Apps Script
 *   2. ลบโค้ดเดิมทั้งหมดใน Code.gs
 *   3. วางโค้ดทั้งหมดด้านล่างนี้ลงไป
 *   4. ตรวจสอบ appsscript.json (ดูด้านล่างสุดของไฟล์นี้)
 *   5. รัน setup() ครั้งแรก → Deploy เป็น Web App
 * ================================================================================
 */


// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Sheets
// ╚════════════════════════════════════════════════════════════════════════════════╝

/**
 * ตัวช่วยเข้าถึง Google Sheets + สร้างชีตอัตโนมัติครั้งแรก
 */

var SHEET_DEFS = {
  Settings: ['key', 'value'],
  Users: ['id', 'username', 'passwordHash', 'salt', 'role', 'active', 'createdAt'],
  Locations: ['id', 'name', 'icon', 'color', 'isReceivingDefault', 'sortOrder'],
  Medicines: ['id', 'name', 'barcode', 'unit', 'imageFileId', 'minStock', 'requireLot', 'defaultLocationId'],
  Stock: ['id', 'medicineId', 'locationId', 'lot', 'expiryDate', 'qty'],
  Movements: ['id', 'type', 'medicineId', 'lot', 'expiryDate', 'fromLocationId', 'toLocationId', 'qty', 'reason', 'source', 'userId', 'timestamp'],
  Sessions: ['token', 'userId', 'role', 'expiresAt']
};

var DEFAULT_SETTINGS = {
  hospitalName: 'โรงพยาบาลส่งเสริมสุขภาพประจำตำบล',
  logoFileId: '',
  warnRed: '35',
  warnOrange: '60',
  warnYellow: '120',
  telegramToken: '',
  telegramChatId: '',
  notifyTime: '08:00',
  notifyEnabled: 'false'
};

function getSS_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// คอลัมน์ที่ต้องบังคับเป็นข้อความล้วน (กัน Sheets แปลงวันที่/บาร์โค้ด/Lot อัตโนมัติ)
var TEXT_COLUMNS = {
  Medicines: ['barcode'],
  Stock: ['lot', 'expiryDate'],
  Movements: ['lot', 'expiryDate'],
  Settings: ['value'],
  Sessions: ['expiresAt']
};

function getSheet_(name) {
  var ss = getSS_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEET_DEFS[name]);
    enforceTextColumns_(sh, name);
  }
  return sh;
}

function enforceTextColumns_(sh, name) {
  var cols = TEXT_COLUMNS[name];
  if (!cols) return;
  var headers = SHEET_DEFS[name];
  cols.forEach(function (c) {
    var idx = headers.indexOf(c);
    if (idx >= 0) sh.getRange(1, idx + 1, sh.getMaxRows(), 1).setNumberFormat('@');
  });
}

/**
 * รันครั้งเดียวจาก Editor: สร้างชีตทั้งหมด + admin เริ่มต้น
 * username: admin / password: admin1234 (เปลี่ยนทันทีหลังล็อกอิน)
 */
function setup() {
  for (var name in SHEET_DEFS) enforceTextColumns_(getSheet_(name), name);

  // เติมค่า settings เริ่มต้นถ้ายังไม่มี
  var current = getSettings();
  for (var k in DEFAULT_SETTINGS) {
    if (current[k] === undefined) setSetting_(k, DEFAULT_SETTINGS[k]);
  }

  // สร้าง admin ถ้ายังไม่มีผู้ใช้
  var users = readAll_('Users');
  if (users.length === 0) {
    var salt = Utilities.getUuid();
    appendRow_('Users', {
      id: Utilities.getUuid(),
      username: 'admin',
      passwordHash: hashPassword_('admin1234', salt),
      salt: salt,
      role: 'admin',
      active: 'true',
      createdAt: new Date().toISOString()
    });
    Logger.log('สร้างผู้ใช้ admin / admin1234 แล้ว — กรุณาเปลี่ยนรหัสผ่านทันที');
  }

  // สถานที่ตัวอย่าง
  var locs = readAll_('Locations');
  if (locs.length === 0) {
    appendRow_('Locations', { id: Utilities.getUuid(), name: 'คลังหลัก', icon: 'package', color: '#2563eb', isReceivingDefault: 'true', sortOrder: '1' });
    appendRow_('Locations', { id: Utilities.getUuid(), name: 'ห้องจ่ายยา', icon: 'pill', color: '#16a34a', isReceivingDefault: 'false', sortOrder: '2' });
  }
  return 'setup เสร็จสิ้น';
}

// ===== อ่าน/เขียนแบบ object =====
function readAll_(name) {
  var sh = getSheet_(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = values[i][c];
    obj.__row = i + 1; // เลขแถวจริงในชีต
    rows.push(obj);
  }
  return rows;
}

function appendRow_(name, obj) {
  var sh = getSheet_(name);
  var headers = SHEET_DEFS[name];
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
  return obj;
}

function updateRow_(name, rowNumber, obj) {
  var sh = getSheet_(name);
  var headers = SHEET_DEFS[name];
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function deleteRowByMatch_(name, predicate) {
  var rows = readAll_(name);
  var sh = getSheet_(name);
  // ลบจากล่างขึ้นบนกันเลขแถวเลื่อน
  for (var i = rows.length - 1; i >= 0; i--) {
    if (predicate(rows[i])) sh.deleteRow(rows[i].__row);
  }
}

function findById_(name, id) {
  var rows = readAll_(name);
  for (var i = 0; i < rows.length; i++) if (String(rows[i].id) === String(id)) return rows[i];
  return null;
}

// ===== Settings =====
function getSettings() {
  var rows = readAll_('Settings');
  var out = {};
  rows.forEach(function (r) { out[r.key] = r.value; });
  return out;
}

function setSetting_(key, value) {
  var sh = getSheet_('Settings');
  var rows = readAll_('Settings');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].key) === String(key)) {
      sh.getRange(rows[i].__row, 2).setValue(value);
      return;
    }
  }
  sh.appendRow([key, value]);
}

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Auth
// ╚════════════════════════════════════════════════════════════════════════════════╝

/**
 * ระบบยืนยันตัวตน: hash+salt (SHA-256), session token, จัดการผู้ใช้
 */

var SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 ชั่วโมง

function hashPassword_(password, salt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + '::' + String(salt), Utilities.Charset.UTF_8);
  return raw.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function login(username, password) {
  var users = readAll_('Users');
  var found = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).toLowerCase() === String(username || '').toLowerCase()) { found = users[i]; break; }
  }
  if (!found) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  if (String(found.active) !== 'true') throw new Error('บัญชีถูกปิดการใช้งาน');
  if (hashPassword_(password, found.salt) !== String(found.passwordHash)) {
    throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  var token = Utilities.getUuid();
  var expiresAt = Date.now() + SESSION_TTL_MS;
  appendRow_('Sessions', { token: token, userId: found.id, role: found.role, expiresAt: String(expiresAt) });
  cleanupSessions_();
  return { token: token, user: { id: found.id, username: found.username, role: found.role } };
}

function validateToken(token) {
  if (!token) return null;
  var sessions = readAll_('Sessions');
  for (var i = 0; i < sessions.length; i++) {
    if (String(sessions[i].token) === String(token)) {
      if (Number(sessions[i].expiresAt) < Date.now()) return null;
      var u = findById_('Users', sessions[i].userId);
      if (!u || String(u.active) !== 'true') return null;
      return { id: u.id, username: u.username, role: u.role };
    }
  }
  return null;
}

function cleanupSessions_() {
  var now = Date.now();
  deleteRowByMatch_('Sessions', function (s) { return Number(s.expiresAt) < now; });
}

// ===== จัดการผู้ใช้ (admin) =====
function listUsers() {
  return readAll_('Users').map(function (u) {
    return { id: u.id, username: u.username, role: u.role, active: String(u.active) === 'true', createdAt: u.createdAt };
  });
}

function saveUser(payload, actor) {
  if (!payload || !payload.username) throw new Error('ต้องระบุชื่อผู้ใช้');
  var role = ['admin', 'pharmacist', 'staff'].indexOf(payload.role) >= 0 ? payload.role : 'staff';

  if (payload.id) {
    var existing = findById_('Users', payload.id);
    if (!existing) throw new Error('ไม่พบผู้ใช้');
    existing.username = payload.username;
    existing.role = role;
    existing.active = payload.active ? 'true' : 'false';
    if (payload.password) {
      existing.salt = Utilities.getUuid();
      existing.passwordHash = hashPassword_(payload.password, existing.salt);
    }
    updateRow_('Users', existing.__row, existing);
    return { id: existing.id };
  }

  // ใหม่ — กันชื่อซ้ำ
  var users = readAll_('Users');
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).toLowerCase() === String(payload.username).toLowerCase()) {
      throw new Error('มีชื่อผู้ใช้นี้แล้ว');
    }
  }
  if (!payload.password) throw new Error('ต้องตั้งรหัสผ่าน');
  var salt = Utilities.getUuid();
  var id = Utilities.getUuid();
  appendRow_('Users', {
    id: id, username: payload.username, passwordHash: hashPassword_(payload.password, salt),
    salt: salt, role: role, active: payload.active === false ? 'false' : 'true', createdAt: new Date().toISOString()
  });
  return { id: id };
}

function deleteUser(id, actor) {
  if (String(actor.id) === String(id)) throw new Error('ลบบัญชีตัวเองไม่ได้');
  var u = findById_('Users', id);
  if (!u) throw new Error('ไม่พบผู้ใช้');
  // กันลบ admin คนสุดท้าย
  if (u.role === 'admin') {
    var admins = readAll_('Users').filter(function (x) { return x.role === 'admin' && String(x.active) === 'true'; });
    if (admins.length <= 1) throw new Error('ต้องมี admin อย่างน้อย 1 บัญชี');
  }
  deleteRowByMatch_('Users', function (x) { return String(x.id) === String(id); });
  deleteRowByMatch_('Sessions', function (s) { return String(s.userId) === String(id); });
  return { deleted: true };
}

function resetPassword(id, newPassword, actor) {
  if (!newPassword) throw new Error('ต้องระบุรหัสผ่านใหม่');
  var u = findById_('Users', id);
  if (!u) throw new Error('ไม่พบผู้ใช้');
  u.salt = Utilities.getUuid();
  u.passwordHash = hashPassword_(newPassword, u.salt);
  updateRow_('Users', u.__row, u);
  deleteRowByMatch_('Sessions', function (s) { return String(s.userId) === String(id); });
  return { reset: true };
}

function changeMyPassword(actor, oldPassword, newPassword) {
  if (!newPassword) throw new Error('ต้องระบุรหัสผ่านใหม่');
  var u = findById_('Users', actor.id);
  if (!u) throw new Error('ไม่พบผู้ใช้');
  if (hashPassword_(oldPassword, u.salt) !== String(u.passwordHash)) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  u.salt = Utilities.getUuid();
  u.passwordHash = hashPassword_(newPassword, u.salt);
  updateRow_('Users', u.__row, u);
  return { changed: true };
}

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Catalog
// ╚════════════════════════════════════════════════════════════════════════════════╝

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

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Drive
// ╚════════════════════════════════════════════════════════════════════════════════╝

/**
 * จัดการรูปภาพยาใน Google Drive
 */

var DRIVE_FOLDER_NAME = 'MedStock_Images';

function getImageFolder_() {
  var settings = getSettings();
  var folderId = settings.imageFolderId;
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }
  // สร้างโฟลเดอร์ใหม่
  var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  setSetting_('imageFolderId', folder.getId());
  return folder;
}

/**
 * อัปโหลดรูป (dataUrl = "data:image/png;base64,....") แล้วผูกกับยา
 */
function uploadMedicineImage(medicineId, dataUrl, filename) {
  if (!medicineId || !dataUrl) throw new Error('ข้อมูลรูปไม่ครบ');
  var med = findById_('Medicines', medicineId);
  if (!med) throw new Error('ไม่พบรายการยา');

  var match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('รูปแบบรูปไม่ถูกต้อง');
  var contentType = match[1];
  var bytes = Utilities.base64Decode(match[2]);
  var blob = Utilities.newBlob(bytes, contentType, filename || (medicineId + '.jpg'));

  // ลบรูปเดิมถ้ามี
  if (med.imageFileId) { try { deleteDriveFile_(med.imageFileId); } catch (e) {} }

  var folder = getImageFolder_();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  med.imageFileId = file.getId();
  updateRow_('Medicines', med.__row, med);
  return { fileId: file.getId() };
}

/**
 * คืนรูปเป็น dataUrl (ให้ frontend แสดงโดยไม่ติดปัญหาสิทธิ์)
 */
function getMedicineImage(fileId) {
  if (!fileId) throw new Error('ไม่มี fileId');
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  var b64 = Utilities.base64Encode(blob.getBytes());
  return { dataUrl: 'data:' + blob.getContentType() + ';base64,' + b64 };
}

/**
 * อัปโหลดโลโก้โรงพยาบาล แล้วเก็บ fileId ใน Settings
 */
function uploadLogo(dataUrl, filename) {
  if (!dataUrl) throw new Error('ไม่มีรูป');
  var match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('รูปแบบรูปไม่ถูกต้อง');
  var blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], filename || 'logo.png');

  var settings = getSettings();
  if (settings.logoFileId) { try { deleteDriveFile_(settings.logoFileId); } catch (e) {} }

  var folder = getImageFolder_();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  setSetting_('logoFileId', file.getId());
  return { fileId: file.getId() };
}

function deleteDriveFile_(fileId) {
  if (!fileId) return;
  DriveApp.getFileById(fileId).setTrashed(true);
}

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Inventory
// ╚════════════════════════════════════════════════════════════════════════════════╝

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
    source: m.source || '',
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
      toLocationId: p.locationId, qty: qty, reason: p.reason || '', source: p.source || '', userId: user.id });
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

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Reports
// ╚════════════════════════════════════════════════════════════════════════════════╝

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

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Notify
// ╚════════════════════════════════════════════════════════════════════════════════╝

/**
 * แจ้งเตือนผ่าน Telegram + ตัวจับเวลารายวัน
 * (โครงเผื่อ LINE Messaging API ในอนาคต — ดู sendLine_)
 */

function saveSettings(settings, user) {
  if (!settings) throw new Error('ไม่มีข้อมูลตั้งค่า');
  var allow = ['hospitalName', 'logoFileId', 'warnRed', 'warnOrange', 'warnYellow',
    'telegramToken', 'telegramChatId', 'notifyTime', 'notifyEnabled'];
  allow.forEach(function (k) {
    if (settings[k] !== undefined) setSetting_(k, String(settings[k]));
  });
  // ถ้าเปลี่ยนเวลา/เปิดปิด ให้ตั้ง trigger ใหม่ (ไม่ให้ error บล็อกการบันทึก
  // เพราะการสร้าง trigger ต้องอนุญาตสิทธิ์โดยรัน setupNotifications จาก Editor ครั้งแรก)
  try { setupNotifications(); } catch (e) { /* ผู้ใช้ต้องรัน setupNotifications ใน Apps Script เอง */ }
  return getSettings();
}

function sendTelegram_(text) {
  var s = getSettings();
  if (!s.telegramToken || !s.telegramChatId) throw new Error('ยังไม่ได้ตั้งค่า Telegram token / chat id');
  var url = 'https://api.telegram.org/bot' + s.telegramToken + '/sendMessage';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: s.telegramChatId, text: text, parse_mode: 'HTML' }),
    muteHttpExceptions: true
  });
  var body = JSON.parse(res.getContentText() || '{}');
  if (!body.ok) throw new Error('Telegram error: ' + (body.description || res.getContentText()));
  return true;
}

// โครงเผื่อ LINE Messaging API (เพิ่มภายหลัง)
function sendLine_(text) {
  var s = getSettings();
  if (!s.lineToken) throw new Error('ยังไม่ได้ตั้งค่า LINE');
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + s.lineToken },
    payload: JSON.stringify({ messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
  return true;
}

function testNotify() {
  sendTelegram_('🔔 ทดสอบการแจ้งเตือนจากระบบจัดการคลังยา รพ.สต.');
  return { sent: true };
}

function buildDailyReportText_() {
  var s = getSettings();
  var dash = getDashboard('');
  var t = dash.thresholds;
  var lines = [];
  lines.push('🏥 <b>' + (s.hospitalName || 'รพ.สต.') + '</b>');
  lines.push('📅 สรุปยาใกล้หมดอายุประจำวัน');
  lines.push('');
  lines.push('🔴 ภายใน ' + t.red + ' วัน (เร่งด่วน): ' + dash.buckets.red + ' รายการ');
  lines.push('🟠 ภายใน ' + t.orange + ' วัน: ' + dash.buckets.orange + ' รายการ');
  lines.push('🟡 ภายใน ' + t.yellow + ' วัน: ' + dash.buckets.yellow + ' รายการ');

  // รายการเร่งด่วน (แดง) สูงสุด 15
  var urgent = dash.items.filter(function (i) { return i.bucket === 'red'; }).slice(0, 15);
  if (urgent.length) {
    lines.push('');
    lines.push('<b>รายการเร่งด่วน:</b>');
    urgent.forEach(function (i) {
      var dleft = i.daysLeft === null ? '-' : (i.daysLeft < 0 ? 'หมดอายุแล้ว' : 'เหลือ ' + i.daysLeft + ' วัน');
      lines.push('• ' + i.medicineName + ' (Lot ' + (i.lot || '-') + ', ' + i.locationName + ') ' + dleft);
    });
  }

  if (dash.lowStock.length) {
    lines.push('');
    lines.push('<b>⚠️ สต็อกต่ำกว่าขั้นต่ำ:</b>');
    dash.lowStock.slice(0, 15).forEach(function (l) {
      lines.push('• ' + l.medicineName + ': มี ' + l.have + ' / ขั้นต่ำ ' + l.minStock);
    });
  }
  return lines.join('\n');
}

/**
 * ฟังก์ชันที่ trigger เรียกทุกวัน
 */
function dailyNotifyJob() {
  var s = getSettings();
  if (String(s.notifyEnabled) !== 'true') return;
  if (!s.telegramToken || !s.telegramChatId) return;
  sendTelegram_(buildDailyReportText_());
}

/**
 * ตั้ง/รีเซ็ต trigger รายวันตามเวลาใน Settings (รันครั้งแรกจาก Editor เพื่ออนุญาตสิทธิ์)
 */
function setupNotifications() {
  // ลบ trigger เดิมของ dailyNotifyJob
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'dailyNotifyJob') ScriptApp.deleteTrigger(tr);
  });

  var s = getSettings();
  if (String(s.notifyEnabled) !== 'true') return 'ปิดการแจ้งเตือน — ไม่ได้ตั้ง trigger';

  var time = String(s.notifyTime || '08:00');
  var parts = time.split(':');
  var hour = Number(parts[0] || 8);

  ScriptApp.newTrigger('dailyNotifyJob')
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .nearMinute(Number(parts[1] || 0))
    .create();
  return 'ตั้ง trigger รายวันเวลา ' + hour + ':00 แล้ว';
}

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  SECTION: Code
// ╚════════════════════════════════════════════════════════════════════════════════╝

/**
 * ระบบจัดการคลังยา รพ.สต. — Google Apps Script Web App (JSON API)
 * Entry point + router. คืนค่า JSON เสมอ (เลี่ยง CORS preflight ด้วย text/plain).
 */

// ===== Action ที่ไม่ต้องล็อกอิน =====
var PUBLIC_ACTIONS = { 'ping': true, 'login': true };

// ===== สิทธิ์ขั้นต่ำของแต่ละ action (admin > pharmacist > staff) =====
var ACTION_ROLES = {
  // ทุก role ที่ล็อกอินแล้วเข้าได้
  'me': 'staff',
  'getDashboard': 'staff',
  'search': 'staff',
  'listLocations': 'staff',
  'listMedicines': 'staff',
  'getMedicineImage': 'staff',
  'listStockByLocation': 'staff',
  'receive': 'staff',
  'exportRows': 'staff',
  'listMovements': 'staff',
  'changeMyPassword': 'staff',
  // pharmacist ขึ้นไป
  'saveLocation': 'pharmacist',
  'deleteLocation': 'pharmacist',
  'reorderLocations': 'pharmacist',
  'saveMedicine': 'pharmacist',
  'deleteMedicine': 'pharmacist',
  'uploadMedicineImage': 'pharmacist',
  'dispense': 'pharmacist',
  'transfer': 'pharmacist',
  'adjustCount': 'pharmacist',
  // admin เท่านั้น
  'getSettings': 'staff',
  'saveSettings': 'admin',
  'uploadLogo': 'admin',
  'getImage': 'staff',
  'listUsers': 'admin',
  'saveUser': 'admin',
  'deleteUser': 'admin',
  'resetPassword': 'admin',
  'testNotify': 'admin'
};

var ROLE_RANK = { 'staff': 1, 'pharmacist': 2, 'admin': 3 };

function doGet(e) {
  // health check / เปิดดูว่า deploy แล้ว
  return jsonOutput({ ok: true, service: 'medication-management', time: new Date().toISOString() });
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return jsonOutput({ ok: false, error: 'INVALID_JSON' });
  }

  var action = req.action || '';
  try {
    // ตรวจสิทธิ์
    var user = null;
    if (!PUBLIC_ACTIONS[action]) {
      user = validateToken(req.token);
      if (!user) return jsonOutput({ ok: false, error: 'UNAUTHORIZED' });
      var need = ACTION_ROLES[action];
      if (!need) return jsonOutput({ ok: false, error: 'UNKNOWN_ACTION:' + action });
      if (ROLE_RANK[user.role] < ROLE_RANK[need]) {
        return jsonOutput({ ok: false, error: 'FORBIDDEN' });
      }
    }

    var data = routeAction(action, req, user);
    return jsonOutput({ ok: true, data: data });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function routeAction(action, req, user) {
  switch (action) {
    case 'ping': return { pong: true };
    case 'login': return login(req.username, req.password);
    case 'me': return { user: { id: user.id, username: user.username, role: user.role } };
    case 'changeMyPassword': return changeMyPassword(user, req.oldPassword, req.newPassword);

    // โครงสร้างคลัง
    case 'listLocations': return listLocations();
    case 'saveLocation': return saveLocation(req.location, user);
    case 'deleteLocation': return deleteLocation(req.id, user);
    case 'reorderLocations': return reorderLocations(req.orderedIds, user);
    case 'listMedicines': return listMedicines();
    case 'saveMedicine': return saveMedicine(req.medicine, user);
    case 'deleteMedicine': return deleteMedicine(req.id, user);
    case 'uploadMedicineImage': return uploadMedicineImage(req.medicineId, req.dataUrl, req.filename);
    case 'getMedicineImage': return getMedicineImage(req.fileId);

    // สต็อก / เคลื่อนไหว
    case 'listStockByLocation': return listStockByLocation(req.locationId);
    case 'receive': return receiveStock(req.payload, user);
    case 'dispense': return dispenseStock(req.payload, user);
    case 'transfer': return transferStock(req.payload, user);
    case 'adjustCount': return adjustCount(req.payload, user);

    // dashboard / ค้นหา / รายงาน
    case 'getDashboard': return getDashboard(req.locationId || '');
    case 'search': return searchAll(req.query || '');
    case 'listMovements': return listMovements(req.filters || {});
    case 'exportRows': return exportRows(req.kind, req.filters || {});

    // ตั้งค่า
    case 'getSettings': return getSettings();
    case 'saveSettings': return saveSettings(req.settings, user);
    case 'uploadLogo': return uploadLogo(req.dataUrl, req.filename);
    case 'getImage': return getMedicineImage(req.fileId);
    case 'listUsers': return listUsers();
    case 'saveUser': return saveUser(req.user, user);
    case 'deleteUser': return deleteUser(req.id, user);
    case 'resetPassword': return resetPassword(req.id, req.newPassword, user);
    case 'testNotify': return testNotify();

    default:
      throw new Error('UNKNOWN_ACTION:' + action);
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ╔════════════════════════════════════════════════════════════════════════════════╗
// ║  หมายเหตุ: appsscript.json (ตั้งค่าในหน้า Apps Script Editor)                ║
// ╚════════════════════════════════════════════════════════════════════════════════╝
//
// {
//   "timeZone": "Asia/Bangkok",
//   "dependencies": {},
//   "webapp": {
//     "executeAs": "USER_DEPLOYING",
//     "access": "ANYONE_ANONYMOUS"
//   },
//   "exceptionLogging": "STACKDRIVER",
//   "runtimeVersion": "V8",
//   "oauthScopes": [
//     "https://www.googleapis.com/auth/spreadsheets",
//     "https://www.googleapis.com/auth/drive",
//     "https://www.googleapis.com/auth/script.external_request",
//     "https://www.googleapis.com/auth/script.scriptapp"
//   ]
// }
