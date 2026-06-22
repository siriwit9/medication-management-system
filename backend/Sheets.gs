/**
 * ตัวช่วยเข้าถึง Google Sheets + สร้างชีตอัตโนมัติครั้งแรก
 */

var SHEET_DEFS = {
  Settings: ['key', 'value'],
  Users: ['id', 'username', 'passwordHash', 'salt', 'role', 'active', 'createdAt'],
  Locations: ['id', 'name', 'icon', 'color', 'isReceivingDefault', 'sortOrder'],
  Medicines: ['id', 'name', 'barcode', 'unit', 'imageFileId', 'minStock', 'requireLot', 'defaultLocationId'],
  Stock: ['id', 'medicineId', 'locationId', 'lot', 'expiryDate', 'qty'],
  Movements: ['id', 'type', 'medicineId', 'lot', 'expiryDate', 'fromLocationId', 'toLocationId', 'qty', 'reason', 'userId', 'timestamp'],
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
