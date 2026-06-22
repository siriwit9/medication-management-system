/** ประวัติการเคลื่อนไหว: รับเข้า / ย้าย / ตัดจ่าย / ปรับยอด + กรอง */
window.Views = window.Views || {};

var MOVE_LABEL = { receive: 'รับเข้า', transfer: 'ย้าย', dispense: 'ตัดจ่าย/ทิ้ง', adjust: 'ปรับยอด' };

Views.history = function (view) {
  view.innerHTML =
    '<div class="page-head"><h1 class="page-title">ประวัติการเคลื่อนไหว</h1></div>' +
    '<div class="card mb-16"><div class="row">' +
    '<div class="field" style="margin:0"><label>ประเภท</label><select id="h-type"><option value="">ทั้งหมด</option>' +
    Object.keys(MOVE_LABEL).map(function (k) { return '<option value="' + k + '">' + MOVE_LABEL[k] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" style="margin:0"><label>จากวันที่</label><input id="h-from" type="date" /></div>' +
    '<div class="field" style="margin:0"><label>ถึงวันที่</label><input id="h-to" type="date" /></div>' +
    '<div class="spacer"></div>' +
    '<button class="btn btn-primary" id="h-apply" style="align-self:flex-end"><span data-lucide="search"></span> ค้นหา</button>' +
    '<button class="btn" id="h-xlsx" style="align-self:flex-end"><span data-lucide="file-spreadsheet"></span> Excel</button>' +
    '</div></div>' +
    '<div id="h-results"></div>';

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
      if (!rows.length) { box.innerHTML = '<div class="card empty-state">ไม่มีรายการ</div>'; return; }
      box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>วันเวลา</th><th>ประเภท</th><th>ชื่อยา</th><th>Lot</th><th>จาก</th><th>ไป</th><th>จำนวน</th><th>หมายเหตุ</th><th>ผู้ทำ</th></tr></thead><tbody>' +
        rows.map(function (m) {
          return '<tr><td>' + U.thaiDateTime(m.timestamp) + '</td><td>' + (MOVE_LABEL[m.type] || m.type) + '</td>' +
            '<td>' + U.escapeHtml(m.medicineName) + '</td><td>' + U.escapeHtml(m.lot || '-') + '</td>' +
            '<td>' + U.escapeHtml(m.fromLocationName || '-') + '</td><td>' + U.escapeHtml(m.toLocationName || '-') + '</td>' +
            '<td>' + m.qty + '</td><td>' + U.escapeHtml(m.reason || '') + '</td><td>' + U.escapeHtml(m.userName || '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    });
  }

  view.querySelector('#h-apply').onclick = load;
  view.querySelector('#h-xlsx').onclick = function () {
    var rows = view._rows || [];
    if (!rows.length) { Toast.error('ไม่มีข้อมูลให้ส่งออก'); return; }
    var aoa = [['วันเวลา', 'ประเภท', 'ชื่อยา', 'Lot', 'วันหมดอายุ', 'จาก', 'ไป', 'จำนวน', 'หมายเหตุ', 'ผู้ทำ']];
    rows.forEach(function (m) {
      aoa.push([U.thaiDateTime(m.timestamp), MOVE_LABEL[m.type] || m.type, m.medicineName, m.lot,
        m.expiryDate ? U.thaiDate(m.expiryDate) : '', m.fromLocationName, m.toLocationName, m.qty, m.reason, m.userName]);
    });
    Exporter.toXlsx(aoa, 'ประวัติเคลื่อนไหว_' + U.todayISO(), 'การเคลื่อนไหว');
  };

  U.refreshIcons();
  return load();
};
