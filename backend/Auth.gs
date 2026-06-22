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
