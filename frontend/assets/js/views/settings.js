/** ตั้งค่า: รพ.สต. / แจ้งเตือน / ผู้ใช้ / ส่งออก / รายงาน PDF / บัญชีของฉัน */
window.Views = window.Views || {};
Views.settings = function (view) {
  var isAdmin = Auth.hasRole('admin');
  var tabs = [];
  if (isAdmin) tabs.push({ id: 'hospital', label: 'ข้อมูลโรงพยาบาล' });
  if (isAdmin) tabs.push({ id: 'notify', label: 'การแจ้งเตือน' });
  if (isAdmin) tabs.push({ id: 'users', label: 'จัดการผู้ใช้' });
  if (isAdmin) tabs.push({ id: 'history_admin', label: 'ลบประวัติเคลื่อนไหว' });
  tabs.push({ id: 'export', label: 'ส่งออกข้อมูล' });
  tabs.push({ id: 'reports', label: 'พิมพ์รายงาน' });
  tabs.push({ id: 'account', label: 'บัญชีของฉัน' });

  view.innerHTML =
    '<div class="page-head"><h1 class="page-title">ตั้งค่า</h1></div>' +
    '<div class="tabs">' + tabs.map(function (t, i) {
      return '<div class="tab' + (i === 0 ? ' active' : '') + '" data-tab="' + t.id + '">' + t.label + '</div>';
    }).join('') + '</div><div id="set-content"></div>';

  var content = view.querySelector('#set-content');
  var renderers = {
    hospital: renderHospital, notify: renderNotify, users: renderUsers,
    history_admin: renderHistoryAdmin, export: renderExport, reports: renderReports, account: renderAccount
  };
  view.querySelectorAll('[data-tab]').forEach(function (t) {
    t.onclick = function () {
      view.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      renderers[t.getAttribute('data-tab')](content);
    };
  });
  return renderers[tabs[0].id](content);
};

/* ===== ข้อมูลโรงพยาบาล + ช่วงเตือน ===== */
function renderHospital(content) {
  content.innerHTML = '<div class="loader">กำลังโหลด...</div>';
  return API.call('getSettings').then(function (s) {
    content.innerHTML = '<div class="card" style="max-width:560px">' +
      '<div class="field"><label>ชื่อโรงพยาบาล</label><input id="s-name" value="' + U.escapeHtml(s.hospitalName || '') + '" /></div>' +
      '<div class="field"><label>โลโก้</label><input id="s-logo" type="file" accept="image/*" /><div id="s-logo-preview" class="mt-16"></div></div>' +
      '<h3>ช่วงเตือน (วัน)</h3>' +
      '<div class="grid grid-2">' +
      '<div class="field"><label>แดง (เร่งด่วน)</label><input id="s-red" type="number" min="1" value="' + (s.warnRed || 35) + '" /></div>' +
      '<div class="field"><label>ส้ม</label><input id="s-orange" type="number" min="1" value="' + (s.warnOrange || 60) + '" /></div>' +
      '<div class="field"><label>เหลือง</label><input id="s-yellow" type="number" min="1" value="' + (s.warnYellow || 120) + '" /></div></div>' +
      '<button class="btn btn-primary" id="s-save"><span data-lucide="save"></span> บันทึก</button></div>' +
      '<div class="card mt-16" style="max-width:560px;border:1px solid #fecaca;background:#fff5f5">' +
      '<h3 style="color:#dc2626;margin-top:0">จัดการประวัติและสต็อกคงเหลือ (สำหรับแอดมิน)</h3>' +
      '<p class="muted" style="margin-bottom:12px">ล้างเฉพาะประวัติการเคลื่อนไหว หรือ ลบจำนวนยาคงเหลือในคลัง (รีเซ็ตยอดเป็น 0) โดย<strong>ไม่ลบ</strong>โครงสร้างยา (รายการยา) สถานที่เก็บยา หรือข้อมูลระบบอื่น</p>' +
      '<div class="row" style="flex-wrap:wrap;gap:8px">' +
      '<button class="btn btn-danger" id="s-clear-history"><span data-lucide="trash-2"></span> ลบประวัติความเคลื่อนไหวทั้งหมด</button>' +
      '<button class="btn btn-danger" id="s-clear-stock"><span data-lucide="package-x"></span> ลบจำนวนยาคงเหลือทั้งหมด</button>' +
      '</div>' +
      '</div>';
    U.refreshIcons();

    var clearHistBtn = content.querySelector('#s-clear-history');
    if (clearHistBtn) {
      clearHistBtn.onclick = function () {
        Modal.confirm({
          title: 'ยืนยันการลบประวัติความเคลื่อนไหวทั้งหมด',
          message: 'ต้องการลบประวัติความเคลื่อนไหวทั้งหมดใช่หรือไม่? (ข้อมูลโครงสร้างยา รายการยา สถานที่จัดเก็บ ยอดสต็อกคงเหลือ และระบบอื่น ๆ จะไม่ถูกลบ)',
          danger: true,
          okText: 'ยืนยันลบประวัติทั้งหมด'
        }).then(function (ok) {
          if (!ok) return;
          clearHistBtn.disabled = true;
          Toast.success('กำลังลบประวัติความเคลื่อนไหว...');
          API.call('clearMovements', {}).then(function () {
            Toast.success('ลบประวัติความเคลื่อนไหวทั้งหมดเรียบร้อยแล้ว');
          }).catch(function (e) {
            Toast.error(e.message || 'เกิดข้อผิดพลาดในการลบประวัติ');
          }).finally(function () {
            clearHistBtn.disabled = false;
          });
        });
      };
    }

    var clearStockBtn = content.querySelector('#s-clear-stock');
    if (clearStockBtn) {
      clearStockBtn.onclick = function () {
        Modal.confirm({
          title: 'ยืนยันการลบจำนวนยาคงเหลือทั้งหมด',
          message: 'ต้องการลบจำนวนยาคงเหลือทั้งหมดในทุกจุดเก็บยา (รีเซ็ตยอดคงเหลือเป็น 0) ใช่หรือไม่? (โครงสร้างยา รายการยา 140+ รายการ และสถานที่เก็บยา จะไม่ถูกลบ)',
          danger: true,
          okText: 'ยืนยันลบจำนวนยาคงเหลือทั้งหมด'
        }).then(function (ok) {
          if (!ok) return;
          clearStockBtn.disabled = true;
          Toast.success('กำลังลบจำนวนยาคงเหลือทั้งหมด...');
          API.call('clearStock', {}).then(function () {
            Toast.success('ลบจำนวนยาคงเหลือทั้งหมดเรียบร้อยแล้ว');
          }).catch(function (e) {
            Toast.error(e.message || 'เกิดข้อผิดพลาดในการลบสต็อก');
          }).finally(function () {
            clearStockBtn.disabled = false;
          });
        });
      };
    }

    var pendingLogo = null;
    var preview = content.querySelector('#s-logo-preview');
    var existingLogo = localStorage.getItem('hospitalLogo');
    if (existingLogo) {
      preview.innerHTML = '<img style="width:80px;height:80px;object-fit:contain;border-radius:8px;border:1px solid var(--border)" src="' + existingLogo + '" /> <button class="btn btn-sm" id="s-logo-remove" style="margin-left:8px">ลบโลโก้</button>';
      var rmBtn = preview.querySelector('#s-logo-remove');
      if (rmBtn) rmBtn.onclick = function () { localStorage.removeItem('hospitalLogo'); preview.innerHTML = '<span class="muted">ยังไม่ได้ตั้งโลโก้</span>'; };
    } else if (s.logoFileId) {
      API.call('getImage', { fileId: s.logoFileId }).then(function (d) {
        preview.innerHTML = '<img style="width:80px;height:80px;object-fit:contain;border-radius:8px;border:1px solid var(--border)" src="' + d.dataUrl + '" />';
        localStorage.setItem('hospitalLogo', d.dataUrl);
      }).catch(function () {});
    }
    content.querySelector('#s-logo').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      U.fileToDataUrl(f).then(function (du) {
        pendingLogo = { dataUrl: du, filename: f.name };
        localStorage.setItem('hospitalLogo', du);
        preview.innerHTML = '<img style="width:80px;height:80px;object-fit:contain;border-radius:8px;border:1px solid var(--border)" src="' + du + '" />';
      });
    });

    content.querySelector('#s-save').onclick = function () {
      var btn = content.querySelector('#s-save'); btn.disabled = true;
      var settings = {
        hospitalName: content.querySelector('#s-name').value.trim(),
        warnRed: content.querySelector('#s-red').value,
        warnOrange: content.querySelector('#s-orange').value,
        warnYellow: content.querySelector('#s-yellow').value
      };
      API.call('saveSettings', { settings: settings }).then(function (ns) {
        App.setSettingsCache(ns);
        document.getElementById('brand-name').textContent = ns.hospitalName || 'คลังยา รพ.สต.';
        if (pendingLogo) return API.call('uploadLogo', { dataUrl: pendingLogo.dataUrl, filename: pendingLogo.filename });
      }).then(function () { Toast.success('บันทึกแล้ว'); })
        .catch(function (e) { Toast.error(e.message); })
        .finally(function () { btn.disabled = false; });
    };
  });
}

/* ===== การแจ้งเตือน (Telegram) ===== */
function renderNotify(content) {
  content.innerHTML = '<div class="loader">กำลังโหลด...</div>';
  return API.call('getSettings').then(function (s) {
    content.innerHTML = '<div class="card" style="max-width:560px">' +
      '<label class="field-inline mb-16"><input type="checkbox" id="n-enabled" style="width:auto"' + (String(s.notifyEnabled) === 'true' ? ' checked' : '') + ' /> เปิดการแจ้งเตือนรายวัน</label>' +
      '<div class="field"><label>ช่องทาง</label><select id="n-channel"><option value="telegram">Telegram</option></select></div>' +
      '<div class="field"><label>Bot Token</label><input id="n-token" value="' + U.escapeHtml(s.telegramToken || '') + '" placeholder="123456:ABC-..." /></div>' +
      '<div class="field"><label>Chat ID</label><input id="n-chat" value="' + U.escapeHtml(s.telegramChatId || '') + '" placeholder="-1001234567890" /></div>' +
      '<div class="field"><label>เวลาส่งรายวัน</label><input id="n-time" type="time" value="' + U.escapeHtml(s.notifyTime || '08:00') + '" />' +
      '<small class="muted">ระบบจะส่งแจ้งเตือนทุกวันตามเวลาที่ตั้ง (บันทึกแล้วมีผลอัตโนมัติ)</small></div>' +
      '<div class="row">' +
      '<button class="btn btn-primary" id="n-save"><span data-lucide="save"></span> บันทึก</button>' +
      '<button class="btn" id="n-test"><span data-lucide="send"></span> ส่งข้อความทดสอบ</button></div>' +
      '<div class="mt-16" style="padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">' +
      '<p style="margin:0 0 4px;font-weight:600"><span data-lucide="clipboard" style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:4px"></span> วิธีตั้งค่า Telegram</p>' +
      '<ol style="margin:0;padding-left:18px;font-size:13px">' +
      '<li>สร้างบอทด้วย <b>@BotFather</b> ใน Telegram เพื่อรับ Bot Token</li>' +
      '<li>เพิ่มบอทเข้ากลุ่ม หรือแชทกับบอทเพื่อหา Chat ID</li>' +
      '<li>กรอก Token + Chat ID ด้านบนแล้วกดบันทึก</li>' +
      '<li>กด "ส่งข้อความทดสอบ" เพื่อตรวจสอบ</li>' +
      '</ol></div>' +
      '<p class="muted mt-16"><b>หมายเหตุ:</b> ครั้งแรกที่ตั้งค่า ต้องเข้า Apps Script Editor → รันฟังก์ชัน <b>setupNotifications</b> หนึ่งครั้งเพื่ออนุญาตสิทธิ์ หลังจากนั้นตั้งเวลาจากหน้านี้ได้เลย</p>' +
      '</div>';
    U.refreshIcons();

    content.querySelector('#n-save').onclick = function () {
      var btn = content.querySelector('#n-save'); btn.disabled = true;
      API.call('saveSettings', { settings: {
        notifyEnabled: content.querySelector('#n-enabled').checked,
        telegramToken: content.querySelector('#n-token').value.trim(),
        telegramChatId: content.querySelector('#n-chat').value.trim(),
        notifyTime: content.querySelector('#n-time').value
      } }).then(function () {
        var time = content.querySelector('#n-time').value || '08:00';
        var enabled = content.querySelector('#n-enabled').checked;
        if (enabled) {
          Toast.success('บันทึกแล้ว — แจ้งเตือนรายวันเวลา ' + time + ' น.');
        } else {
          Toast.success('บันทึกแล้ว — ปิดการแจ้งเตือน');
        }
      })
        .catch(function (e) { Toast.error(e.message); })
        .finally(function () { btn.disabled = false; });
    };
    content.querySelector('#n-test').onclick = function () {
      var btn = content.querySelector('#n-test'); btn.disabled = true;
      API.call('testNotify').then(function () { Toast.success('ส่งข้อความทดสอบแล้ว'); })
        .catch(function (e) { Toast.error(e.message); })
        .finally(function () { btn.disabled = false; });
    };
  });
}

/* ===== จัดการผู้ใช้ ===== */
function renderUsers(content) {
  content.innerHTML = '<div class="loader">กำลังโหลด...</div>';
  return API.call('listUsers').then(function (users) {
    content.innerHTML = '<div class="page-head"><span></span><button class="btn btn-primary" id="add-user"><span data-lucide="user-plus"></span> เพิ่มผู้ใช้</button></div>' +
      '<div id="user-list"></div>';
    var list = content.querySelector('#user-list');
    list.innerHTML = users.map(function (u) {
      return '<div class="list-item"><span data-lucide="user"></span><div class="grow"><div class="title">' + U.escapeHtml(u.username) +
        (u.active ? '' : ' <span class="pill-tag tag-red">ปิดใช้งาน</span>') + '</div><div class="sub">' + (Auth.ROLE_LABEL[u.role] || u.role) + '</div></div>' +
        '<button class="btn btn-sm" data-edit="' + u.id + '">แก้ไข</button> ' +
        '<button class="btn btn-sm" data-reset="' + u.id + '">รีเซ็ตรหัส</button> ' +
        '<button class="btn btn-sm btn-danger" data-del="' + u.id + '">ลบ</button></div>';
    }).join('');
    U.refreshIcons();

    content.querySelector('#add-user').onclick = function () { userForm(null, function () { renderUsers(content); }); };
    list.querySelectorAll('[data-edit]').forEach(function (b) {
      b.onclick = function () { userForm(users.filter(function (x) { return x.id === b.getAttribute('data-edit'); })[0], function () { renderUsers(content); }); };
    });
    list.querySelectorAll('[data-reset]').forEach(function (b) {
      b.onclick = function () { resetPwForm(b.getAttribute('data-reset')); };
    });
    list.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        Modal.confirm({ title: 'ลบผู้ใช้', message: 'ยืนยันลบผู้ใช้นี้?', danger: true, okText: 'ลบ' }).then(function (ok) {
          if (!ok) return;
          API.call('deleteUser', { id: b.getAttribute('data-del') }).then(function () { Toast.success('ลบแล้ว'); renderUsers(content); }).catch(function (e) { Toast.error(e.message); });
        });
      };
    });
  });
}

function userForm(u, onSaved) {
  u = u || { username: '', role: 'staff', active: true };
  var body = U.el('<div>' +
    '<div class="field"><label>ชื่อผู้ใช้ *</label><input id="u-name" value="' + U.escapeHtml(u.username) + '" /></div>' +
    '<div class="field"><label>บทบาท</label><select id="u-role">' +
    ['admin', 'pharmacist', 'staff'].map(function (r) { return '<option value="' + r + '"' + (r === u.role ? ' selected' : '') + '>' + (Auth.ROLE_LABEL[r]) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>รหัสผ่าน' + (u.id ? ' (เว้นว่างหากไม่เปลี่ยน)' : ' *') + '</label><input id="u-pass" type="password" /></div>' +
    '<label class="field-inline"><input type="checkbox" id="u-active" style="width:auto"' + (u.active ? ' checked' : '') + ' /> เปิดใช้งาน</label></div>');
  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">บันทึก</button>'); footer.appendChild(ok);
  var m = Modal.open({ title: u.id ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้', body: body, footer: footer });
  ok.onclick = function () {
    var payload = { id: u.id, username: body.querySelector('#u-name').value.trim(), role: body.querySelector('#u-role').value, active: body.querySelector('#u-active').checked };
    var pass = body.querySelector('#u-pass').value;
    if (pass) payload.password = pass;
    if (!payload.username) { Toast.error('ระบุชื่อผู้ใช้'); return; }
    if (!u.id && !pass) { Toast.error('ตั้งรหัสผ่าน'); return; }
    ok.disabled = true;
    API.call('saveUser', { user: payload }).then(function () { Toast.success('บันทึกแล้ว'); m.close(); onSaved(); }).catch(function (e) { Toast.error(e.message); ok.disabled = false; });
  };
}

function resetPwForm(id) {
  var body = U.el('<div><div class="field"><label>รหัสผ่านใหม่</label><input id="rp" type="password" /></div></div>');
  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">รีเซ็ต</button>'); footer.appendChild(ok);
  var m = Modal.open({ title: 'รีเซ็ตรหัสผ่าน', body: body, footer: footer });
  ok.onclick = function () {
    var np = body.querySelector('#rp').value;
    if (!np) { Toast.error('ระบุรหัสผ่านใหม่'); return; }
    ok.disabled = true;
    API.call('resetPassword', { id: id, newPassword: np }).then(function () { Toast.success('รีเซ็ตแล้ว'); m.close(); }).catch(function (e) { Toast.error(e.message); ok.disabled = false; });
  };
}

/* ===== ส่งออกข้อมูล ===== */
function renderExport(content) {
  content.innerHTML = '<div class="card" style="max-width:560px">' +
    '<div class="field"><label>ประเภทข้อมูล</label><select id="e-kind">' +
    '<option value="receive">รับเข้า</option><option value="movements">การเคลื่อนไหวทั้งหมด</option><option value="stock">สต็อกคงเหลือ</option></select></div>' +
    '<div class="grid grid-2"><div class="field"><label>จากวันที่</label><input id="e-from" type="date" /></div>' +
    '<div class="field"><label>ถึงวันที่</label><input id="e-to" type="date" /></div></div>' +
    '<button class="btn btn-primary" id="e-go"><span data-lucide="file-spreadsheet"></span> ส่งออก Excel</button>' +
    '<p class="muted mt-16">ได้ไฟล์ .xlsx เปิดด้วย Excel หรือ Google Sheets รองรับภาษาไทย</p></div>';
  U.refreshIcons();
  content.querySelector('#e-go').onclick = function () {
    var kind = content.querySelector('#e-kind').value;
    var filters = { from: content.querySelector('#e-from').value, to: content.querySelector('#e-to').value };
    var btn = content.querySelector('#e-go'); btn.disabled = true;
    API.call('exportRows', { kind: kind, filters: filters }).then(function (d) {
      if (!d.rows.length) { Toast.error('ไม่มีข้อมูลในช่วงที่เลือก'); return; }
      var aoa = [d.headers];
      d.rows.forEach(function (r) {
        aoa.push(r.map(function (cell, i) {
          // แปลงวันที่ ISO ในคอลัมน์เป็น พ.ศ. แบบอ่านง่าย (เฉพาะที่ดูเป็นวันที่)
          return cell;
        }));
      });
      var nameMap = { receive: 'รับเข้า', movements: 'การเคลื่อนไหว', stock: 'สต็อกคงเหลือ' };
      Exporter.toXlsx(aoa, nameMap[kind] + '_' + U.todayISO(), nameMap[kind]);
    }).catch(function (e) { Toast.error(e.message); }).finally(function () { btn.disabled = false; });
  };
}

/* ===== พิมพ์รายงาน PDF ===== */
function renderReports(content) {
  content.innerHTML = '<div class="card" style="max-width:560px">' +
    '<h3>พิมพ์รายงาน (PDF)</h3>' +
    '<div class="row"><button class="btn btn-primary" id="r-exp"><span data-lucide="file-text"></span> รายงานใกล้หมดอายุ</button>' +
    '<button class="btn btn-primary" id="r-stock"><span data-lucide="file-text"></span> รายงานสต็อกคงเหลือ</button></div></div>';
  U.refreshIcons();

  content.querySelector('#r-exp').onclick = function () {
    API.call('getDashboard', { locationId: '' }).then(function (d) {
      var rows = d.items.filter(function (i) { return i.bucket !== 'green'; }).map(function (i) {
        return [i.medicineName, i.locationName, i.lot || '-', U.thaiDate(i.expiryDate), U.daysLeftText(i.daysLeft), String(i.qty)];
      });
      if (!rows.length) { Toast.error('ไม่มีรายการใกล้หมดอายุ'); return; }
      Exporter.toPdf({ title: 'รายงานยาใกล้หมดอายุ', subtitle: 'ณ ' + U.thaiDate(new Date()),
        headers: ['ชื่อยา', 'สถานที่', 'Lot', 'วันหมดอายุ', 'สถานะ', 'คงเหลือ'], rows: rows, filename: 'near_expiry_' + U.todayISO() });
    });
  };
  content.querySelector('#r-stock').onclick = function () {
    API.call('exportRows', { kind: 'stock', filters: {} }).then(function (d) {
      if (!d.rows.length) { Toast.error('ไม่มีสต็อก'); return; }
      var rows = d.rows.map(function (r) { return [r[0], r[2], r[3], r[4] ? U.thaiDate(r[4]) : '-', String(r[5]), r[6]]; });
      Exporter.toPdf({ title: 'รายงานสต็อกคงเหลือ', subtitle: 'ณ ' + U.thaiDate(new Date()), landscape: true,
        headers: ['ชื่อยา', 'สถานที่', 'Lot', 'วันหมดอายุ', 'คงเหลือ', 'หน่วย'], rows: rows, filename: 'stock_' + U.todayISO() });
    });
  };
}

/* ===== บัญชีของฉัน (เปลี่ยนรหัสผ่าน) ===== */
function renderAccount(content) {
  var u = Auth.getUser();
  content.innerHTML = '<div class="card" style="max-width:480px">' +
    '<p>ผู้ใช้: <strong>' + U.escapeHtml(u.username) + '</strong> · ' + (Auth.ROLE_LABEL[u.role] || u.role) + '</p>' +
    '<div class="field"><label>รหัสผ่านเดิม</label><input id="a-old" type="password" /></div>' +
    '<div class="field"><label>รหัสผ่านใหม่</label><input id="a-new" type="password" /></div>' +
    '<button class="btn btn-primary" id="a-save"><span data-lucide="key"></span> เปลี่ยนรหัสผ่าน</button></div>';
  U.refreshIcons();
  content.querySelector('#a-save').onclick = function () {
    var oldp = content.querySelector('#a-old').value, newp = content.querySelector('#a-new').value;
    if (!oldp || !newp) { Toast.error('กรอกให้ครบ'); return; }
    var btn = content.querySelector('#a-save'); btn.disabled = true;
    API.call('changeMyPassword', { oldPassword: oldp, newPassword: newp })
      .then(function () { Toast.success('เปลี่ยนรหัสผ่านแล้ว'); content.querySelector('#a-old').value = ''; content.querySelector('#a-new').value = ''; })
      .catch(function (e) { Toast.error(e.message); })
      .finally(function () { btn.disabled = false; });
  };
}

/* ===== จัดการ/ลบประวัติความเคลื่อนไหว และ สต็อกคงเหลือ (สำหรับแอดมิน) ===== */
function renderHistoryAdmin(content) {
  content.innerHTML = '<div class="loader">กำลังโหลดข้อมูล...</div>';
  return Promise.all([
    API.call('listMovements', { filters: {} }),
    API.call('listStockByLocation', { locationId: '' })
  ]).then(function (res) {
    var rows = res[0] || [];
    var stockRows = res[1] || [];
    var count = rows.length;
    var stockCount = stockRows.length;
    content.innerHTML =
      '<div class="card" style="max-width:600px">' +
      '<h3 style="margin-top:0">จัดการประวัติความเคลื่อนไหว & จำนวนยาคงเหลือ (แอดมิน)</h3>' +
      '<p>ประวัติความเคลื่อนไหวในระบบ: <strong>' + count + ' รายการ</strong> · รายการล็อตยาคงเหลือในคลัง: <strong>' + stockCount + ' รายการ</strong></p>' +
      '<div style="padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;margin-bottom:16px">' +
      '<p style="margin:0;font-size:14px"><strong>ข้อมูลที่ปลอดภัย (ไม่ถูกลบ):</strong> โครงสร้างคลัง, สถานที่จัดเก็บยา, รายการยาทั้งหมด (ชื่อยา/บาร์โค้ด/หน่วยนับ) และบัญชีผู้ใช้ <strong>จะไม่ถูกลบ</strong></p>' +
      '</div>' +
      '<h4>ตัวเลือกที่ 1: ลบประวัติความเคลื่อนไหวตามเงื่อนไข</h4>' +
      '<div class="grid grid-2">' +
      '<div class="field"><label>ประเภทรายการ</label><select id="ha-type">' +
      '<option value="">ทั้งหมดทุกประเภท</option>' +
      '<option value="receive">รับเข้า</option>' +
      '<option value="transfer">ย้าย</option>' +
      '<option value="dispense">ตัดจ่าย/ทิ้ง</option>' +
      '<option value="adjust">ปรับยอด</option>' +
      '</select></div>' +
      '<div></div>' +
      '<div class="field"><label>ตั้งแต่วันที่</label><input id="ha-from" type="date" /></div>' +
      '<div class="field"><label>ถึงวันที่</label><input id="ha-to" type="date" /></div>' +
      '</div>' +
      '<button class="btn btn-danger" id="ha-clear-filter"><span data-lucide="filter-x"></span> ลบประวัติตามเงื่อนไขที่เลือก</button>' +
      '<hr style="margin:24px 0;border:none;border-top:1px solid var(--border)" />' +
      '<h4 style="color:#dc2626">ตัวเลือกที่ 2: ลบประวัติความเคลื่อนไหวทั้งหมด</h4>' +
      '<p class="muted">ล้างประวัติความเคลื่อนไหวทุกรายการในระบบให้เป็นศูนย์ทันที</p>' +
      '<button class="btn btn-danger" id="ha-clear-all"><span data-lucide="trash-2"></span> ลบประวัติความเคลื่อนไหวทั้งหมด (' + count + ' รายการ)</button>' +
      '<hr style="margin:24px 0;border:none;border-top:1px solid var(--border)" />' +
      '<h4 style="color:#dc2626">ตัวเลือกที่ 3: ลบจำนวนยาคงเหลือทั้งหมด (รีเซ็ตสต็อกเป็น 0)</h4>' +
      '<p class="muted">ลบยอดยาคงเหลือและล็อตยาในคลังทุกจุดให้เป็น 0 โดยไม่ลบรายชื่อยาและโครงสร้างคลัง</p>' +
      '<button class="btn btn-danger" id="ha-clear-stock"><span data-lucide="package-x"></span> ลบจำนวนยาคงเหลือทั้งหมด (' + stockCount + ' รายการ)</button>' +
      '</div>';
    U.refreshIcons();

    content.querySelector('#ha-clear-filter').onclick = function () {
      var filters = {
        type: content.querySelector('#ha-type').value,
        from: content.querySelector('#ha-from').value,
        to: content.querySelector('#ha-to').value
      };
      if (!filters.type && !filters.from && !filters.to) {
        Toast.error('กรุณาเลือกประเภทหรือช่วงวันที่ หรือใช้ปุ่ม "ลบประวัติความเคลื่อนไหวทั้งหมด" ด้านล่าง');
        return;
      }
      Modal.confirm({
        title: 'ยืนยันการลบประวัติตามเงื่อนไข',
        message: 'ต้องการลบประวัติความเคลื่อนไหวตามเงื่อนไขที่เลือกใช่หรือไม่? (ไม่กระทบโครงสร้างยาหรือสต็อกคงเหลือ)',
        danger: true,
        okText: 'ยืนยันการลบ'
      }).then(function (ok) {
        if (!ok) return;
        var btn = content.querySelector('#ha-clear-filter'); btn.disabled = true;
        API.call('clearMovements', { filters: filters }).then(function () {
          Toast.success('ลบประวัติความเคลื่อนไหวตามเงื่อนไขเรียบร้อยแล้ว');
          renderHistoryAdmin(content);
        }).catch(function (e) {
          Toast.error(e.message || 'เกิดข้อผิดพลาด');
          btn.disabled = false;
        });
      });
    };

    content.querySelector('#ha-clear-all').onclick = function () {
      Modal.confirm({
        title: 'ยืนยันการลบประวัติความเคลื่อนไหวทั้งหมด',
        message: 'ต้องการลบประวัติความเคลื่อนไหวทั้งหมด (' + count + ' รายการ) ออกจากระบบใช่หรือไม่? (ไม่ลบโครงสร้างยา สถานที่เก็บยา หรือระบบอื่น)',
        danger: true,
        okText: 'ยืนยันลบประวัติทั้งหมด'
      }).then(function (ok) {
        if (!ok) return;
        var btn = content.querySelector('#ha-clear-all'); btn.disabled = true;
        API.call('clearMovements', {}).then(function () {
          Toast.success('ลบประวัติความเคลื่อนไหวทั้งหมดเรียบร้อยแล้ว');
          renderHistoryAdmin(content);
        }).catch(function (e) {
          Toast.error(e.message || 'เกิดข้อผิดพลาด');
          btn.disabled = false;
        });
      });
    };

    content.querySelector('#ha-clear-stock').onclick = function () {
      Modal.confirm({
        title: 'ยืนยันการลบจำนวนยาคงเหลือทั้งหมด',
        message: 'ต้องการลบจำนวนยาคงเหลือทั้งหมด (' + stockCount + ' รายการ) ในทุกจุดเก็บยาใช่หรือไม่? (ไม่ลบโครงสร้างยา รายชื่อยา หรือสถานที่เก็บยา)',
        danger: true,
        okText: 'ยืนยันลบจำนวนยาคงเหลือทั้งหมด'
      }).then(function (ok) {
        if (!ok) return;
        var btn = content.querySelector('#ha-clear-stock'); btn.disabled = true;
        API.call('clearStock', {}).then(function () {
          Toast.success('ลบจำนวนยาคงเหลือทั้งหมดเรียบร้อยแล้ว');
          renderHistoryAdmin(content);
        }).catch(function (e) {
          Toast.error(e.message || 'เกิดข้อผิดพลาด');
          btn.disabled = false;
        });
      });
    };
  });
}
