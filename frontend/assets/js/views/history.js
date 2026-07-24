/** ประวัติการเคลื่อนไหว: รับเข้า / ย้าย / ตัดจ่าย / ปรับยอด + กรอง + แก้ไข/ยกเลิกรายการผิดพลาด */
window.Views = window.Views || {};

var MOVE_LABEL = { receive: 'รับเข้า', transfer: 'ย้าย', dispense: 'ตัดจ่าย/ทิ้ง', adjust: 'ปรับยอด' };

Views.history = function (view) {
  var locsCache = [];

  view.innerHTML =
    '<div class="page-head"><h1 class="page-title">ประวัติการเคลื่อนไหว</h1></div>' +
    '<div class="card mb-16"><div class="row" style="flex-wrap:wrap;gap:12px">' +
    '<div class="field" style="margin:0"><label>ประเภท</label><select id="h-type"><option value="">ทั้งหมด</option>' +
    Object.keys(MOVE_LABEL).map(function (k) { return '<option value="' + k + '">' + MOVE_LABEL[k] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" style="margin:0"><label>จากวันที่</label><input id="h-from" type="date" /></div>' +
    '<div class="field" style="margin:0"><label>ถึงวันที่</label><input id="h-to" type="date" /></div>' +
    '<div class="spacer"></div>' +
    '<button class="btn btn-primary" id="h-apply" style="align-self:flex-end"><span data-lucide="search"></span> ค้นหา</button>' +
    '<button class="btn" id="h-xlsx" style="align-self:flex-end"><span data-lucide="file-spreadsheet"></span> Excel</button>' +
    '</div></div>' +
    '<div id="h-results"></div>';

  API.call('listLocations').then(function (l) { locsCache = l; }).catch(function () {});

  function load() {
    var filters = {
      type: view.querySelector('#h-type').value,
      from: view.querySelector('#h-from').value,
      to: view.querySelector('#h-to').value
    };
    var box = view.querySelector('#h-results');
    box.innerHTML = '<div class="loader">กำลังโหลด...</div>';
    return API.call('listMovements', { filters: filters }).then(function (rows) {
      view._rows = rows;
      if (!rows.length) { box.innerHTML = '<div class="card empty-state">ไม่มีรายการเคลื่อนไหวในระบบ</div>'; return; }
      box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>วันเวลา</th><th>ประเภท</th><th>ชื่อยา</th><th>Lot</th><th>จาก</th><th>ไป</th><th>จำนวน</th><th>หมายเหตุ</th><th>ผู้ทำ</th><th>จัดการ</th></tr></thead><tbody>' +
        rows.map(function (m, idx) {
          var canEdit = Auth.hasRole('pharmacist') || Auth.hasRole('admin');
          return '<tr><td>' + U.thaiDateTime(m.timestamp) + '</td>' +
            '<td><span class="pill-tag ' + (m.type === 'receive' ? 'tag-green' : (m.type === 'dispense' ? 'tag-red' : 'tag-blue')) + '">' + (MOVE_LABEL[m.type] || m.type) + '</span></td>' +
            '<td><strong>' + U.escapeHtml(m.medicineName) + '</strong></td>' +
            '<td>' + U.escapeHtml(m.lot || '-') + '</td>' +
            '<td>' + U.escapeHtml(m.fromLocationName || '-') + '</td>' +
            '<td>' + U.escapeHtml(m.toLocationName || '-') + '</td>' +
            '<td><strong>' + m.qty + '</strong> ' + U.escapeHtml(m.unit || '') + '</td>' +
            '<td>' + U.escapeHtml(m.reason || '-') + '</td>' +
            '<td>' + U.escapeHtml(m.userName || '-') + '</td>' +
            '<td>' + (canEdit ? '<button class="btn btn-sm" data-edit-idx="' + idx + '">แก้ไข</button> <button class="btn btn-sm btn-danger" data-del-idx="' + idx + '">ยกเลิก/ลบ</button>' : '-') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      U.refreshIcons();

      box.querySelectorAll('[data-edit-idx]').forEach(function (btn) {
        btn.onclick = function () {
          var idx = Number(btn.getAttribute('data-edit-idx'));
          openEditMovementModal(rows[idx], locsCache, load);
        };
      });
      box.querySelectorAll('[data-del-idx]').forEach(function (btn) {
        btn.onclick = function () {
          var idx = Number(btn.getAttribute('data-del-idx'));
          confirmDeleteMovement(rows[idx], load);
        };
      });
    });
  }

  view.querySelector('#h-apply').onclick = load;
  view.querySelector('#h-xlsx').onclick = function () {
    var rows = view._rows || [];
    if (!rows.length) { Toast.error('ไม่มีข้อมูลให้ส่งออก'); return; }
    var aoa = [['วันเวลา', 'ประเภท', 'ชื่อยา', 'Lot', 'วันหมดอายุ', 'จาก', 'ไป', 'จำนวน', 'หน่วย', 'หมายเหตุ', 'ผู้ทำ']];
    rows.forEach(function (m) {
      aoa.push([U.thaiDateTime(m.timestamp), MOVE_LABEL[m.type] || m.type, m.medicineName, m.lot,
        m.expiryDate ? U.thaiDate(m.expiryDate) : '', m.fromLocationName, m.toLocationName, m.qty, m.unit, m.reason, m.userName]);
    });
    Exporter.toXlsx(aoa, 'ประวัติเคลื่อนไหว_' + U.todayISO(), 'การเคลื่อนไหว');
  };

  U.refreshIcons();
  return load();
};

function openEditMovementModal(m, locs, onSaved) {
  var targetLocId = m.toLocationId || m.fromLocationId;
  var expVal = m.expiryDate ? String(m.expiryDate).slice(0, 10) : '';

  var body = U.el('<div>' +
    '<p style="margin-bottom:12px"><strong>แก้ไขรายการ:</strong> ' + U.escapeHtml(m.medicineName) + ' (' + (MOVE_LABEL[m.type] || m.type) + ')</p>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>จำนวน *</label><input id="em-qty" type="number" min="1" value="' + m.qty + '" /></div>' +
    '<div class="field"><label>หมายเลข Lot</label><input id="em-lot" value="' + U.escapeHtml(m.lot || '') + '" /></div>' +
    '<div class="field"><label>วันหมดอายุ</label><input id="em-exp" type="date" value="' + expVal + '" /></div>' +
    '<div class="field"><label>สถานที่</label><select id="em-loc">' +
    locs.map(function (l) { return '<option value="' + l.id + '"' + (l.id === targetLocId ? ' selected' : '') + '>' + U.escapeHtml(l.name) + '</option>'; }).join('') +
    '</select></div>' +
    '</div>' +
    '<div class="field"><label>เหตุผล/หมายเหตุการแก้ไข *</label><input id="em-reason" value="' + U.escapeHtml(m.reason || '') + '" placeholder="เช่น แก้ไขจำนวนที่คีย์ผิด" /></div>' +
    '</div>');

  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">บันทึกการแก้ไข</button>');
  footer.appendChild(ok);
  var modal = Modal.open({ title: 'แก้ไขประวัติเคลื่อนไหว (ปรับสต็อกอัตโนมัติ)', body: body, footer: footer, wide: true });

  ok.onclick = function () {
    var qty = Number(body.querySelector('#em-qty').value);
    var lot = body.querySelector('#em-lot').value.trim();
    var exp = body.querySelector('#em-exp').value;
    var locId = body.querySelector('#em-loc').value;
    var reason = body.querySelector('#em-reason').value.trim();

    if (!(qty > 0)) { Toast.error('กรุณาระบุจำนวนที่ถูกต้อง'); return; }
    ok.disabled = true; ok.textContent = 'กำลังบันทึก...';

    API.call('saveMovement', {
      movement: { id: m.id, qty: qty, lot: lot, expiryDate: exp, toLocationId: locId, reason: reason }
    }).then(function () {
      Toast.success('แก้ไขรายการและปรับยอดสต็อกเรียบร้อย');
      modal.close();
      onSaved();
    }).catch(function (err) {
      Toast.error(err.message || 'เกิดข้อผิดพลาดในการแก้ไข');
      ok.disabled = false; ok.textContent = 'บันทึกการแก้ไข';
    });
  };
}

function confirmDeleteMovement(m, onDeleted) {
  Modal.confirm({
    title: 'ยกเลิก / ลบรายการเคลื่อนไหว',
    message: 'ยืนยันยกเลิกรายการ (' + U.escapeHtml(m.medicineName) + ' จำนวน ' + m.qty + ' ' + U.escapeHtml(m.unit) + ')? ระบบจะทำการปรับคืนยอดสต็อกยาให้อัตโนมัติ',
    danger: true,
    okText: 'ยืนยันยกเลิกรายการ'
  }).then(function (ok) {
    if (!ok) return;
    Toast.success('กำลังยกเลิกรายการ...');
    API.call('deleteMovement', { id: m.id }).then(function () {
      Toast.success('ยกเลิกรายการเคลื่อนไหวและปรับคืนสต็อกสำเร็จ');
      onDeleted();
    }).catch(function (err) {
      Toast.error(err.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    });
  });
}
