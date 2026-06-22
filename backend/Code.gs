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
