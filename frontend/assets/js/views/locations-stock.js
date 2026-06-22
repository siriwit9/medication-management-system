/** ยาแต่ละจุด: ดูรายการ + ตัดจ่าย/ทิ้ง + ตรวจนับ + ย้าย */
window.Views = window.Views || {};
Views.locationsStock = function (view, params) {
  var selected = params.location || '';
  var canManage = Auth.hasRole('pharmacist');

  return Promise.all([
    API.call('listLocations'),
    API.call('getDashboard', { locationId: '' })
  ]).then(function (res) {
    var locs = res[0];
    var dash = res[1];

    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">ยาแต่ละจุด</h1></div>' +
      '<div class="grid grid-2 mb-16" id="loc-cards"></div>' +
      '<div id="stock-area"></div>';

    var cards = view.querySelector('#loc-cards');
    var allCard = '<div class="card card-clickable loc-card" data-loc=""><div class="loc-icon" style="background:#0f172a"><span data-lucide="layers"></span></div>' +
      '<div class="loc-meta"><div class="name">รวมทุกสถานที่</div><div class="sub muted">ดูสต็อกทั้งระบบ</div></div></div>';
    cards.innerHTML = allCard + dash.perLocation.map(function (l) {
      return '<div class="card card-clickable loc-card" data-loc="' + l.id + '"><div class="loc-icon" style="background:' + U.escapeHtml(l.color) + '"><span data-lucide="' + U.escapeHtml(l.icon || 'map-pin') + '"></span></div>' +
        '<div class="loc-meta"><div class="name">' + U.escapeHtml(l.name) + '</div><div class="sub muted">' + l.lines + ' รายการ · รวม ' + l.totalQty + '</div></div></div>';
    }).join('');
    cards.querySelectorAll('[data-loc]').forEach(function (c) {
      c.onclick = function () { selected = c.getAttribute('data-loc'); load(); };
    });

    function load() {
      var area = view.querySelector('#stock-area');
      area.innerHTML = '<div class="loader">กำลังโหลด...</div>';
      API.call('listStockByLocation', { locationId: selected }).then(function (rows) {
        var title = selected ? (locs.filter(function (l) { return l.id === selected; })[0] || {}).name : 'รวมทุกสถานที่';
        area.innerHTML = '<div class="page-head"><h2 class="page-title" style="font-size:18px">สต็อก: ' + U.escapeHtml(title) + '</h2></div>' +
          renderStockTable(rows, canManage, !selected);
        bindActions(area, rows, locs, load);
        U.refreshIcons();
      });
    }

    load();
    U.refreshIcons();
  });
};

function renderStockTable(rows, canManage, showLoc) {
  if (!rows.length) return '<div class="card empty-state">ไม่มียาในส่วนนี้</div>';
  var head = '<tr><th>ชื่อยา</th>' + (showLoc ? '<th>สถานที่</th>' : '') + '<th>Lot</th><th>วันหมดอายุ</th><th>คงเหลือ</th>' + (canManage ? '<th>จัดการ</th>' : '') + '</tr>';
  var body = rows.map(function (r) {
    var actions = canManage ?
      '<td><button class="btn btn-sm" data-act="dispense" data-id="' + r.stockId + '">ตัดจ่าย/ทิ้ง</button> ' +
      '<button class="btn btn-sm" data-act="count" data-id="' + r.stockId + '">ตรวจนับ</button> ' +
      '<button class="btn btn-sm" data-act="transfer" data-id="' + r.stockId + '">ย้าย</button></td>' : '';
    return '<tr><td>' + U.escapeHtml(r.medicineName) + '</td>' +
      (showLoc ? '<td>' + U.escapeHtml(r.locationName || '') + '</td>' : '') +
      '<td>' + U.escapeHtml(r.lot || '-') + '</td><td>' + U.thaiDate(r.expiryDate) + '</td>' +
      '<td>' + r.qty + ' ' + U.escapeHtml(r.unit || '') + '</td>' + actions + '</tr>';
  }).join('');
  return '<div class="table-wrap"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
}

function bindActions(area, rows, locs, reload) {
  var byId = {};
  rows.forEach(function (r) { byId[r.stockId] = r; });
  area.querySelectorAll('[data-act]').forEach(function (btn) {
    var r = byId[btn.getAttribute('data-id')];
    var act = btn.getAttribute('data-act');
    btn.onclick = function () {
      if (act === 'dispense') openDispense(r, reload);
      else if (act === 'count') openCount(r, reload);
      else if (act === 'transfer') openTransfer(r, locs, reload);
    };
  });
}

function openDispense(r, reload) {
  var body = U.el('<div>' +
    '<p><strong>' + U.escapeHtml(r.medicineName) + '</strong> · Lot ' + U.escapeHtml(r.lot || '-') + ' · คงเหลือ ' + r.qty + '</p>' +
    '<div class="field"><label>เหตุผล</label><select id="d-reason"><option value="dispense">เบิกใช้</option><option value="expired">หมดอายุ</option><option value="damaged">ชำรุด</option></select></div>' +
    '<div class="field"><label>จำนวน</label><input id="d-qty" type="number" min="1" max="' + r.qty + '" value="1" /></div></div>');
  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-danger">ยืนยันตัดจ่าย</button>');
  footer.appendChild(ok);
  var m = Modal.open({ title: 'ตัดจ่าย / ทิ้งยา', body: body, footer: footer });
  ok.onclick = function () {
    var qty = Number(body.querySelector('#d-qty').value);
    var reason = body.querySelector('#d-reason').value;
    if (!(qty > 0) || qty > r.qty) { Toast.error('จำนวนไม่ถูกต้อง'); return; }
    ok.disabled = true;
    API.call('dispense', { payload: { stockId: r.stockId, qty: qty, reason: reason } })
      .then(function () { Toast.success('ตัดจ่ายสำเร็จ'); m.close(); reload(); })
      .catch(function (e) { Toast.error(e.message); ok.disabled = false; });
  };
}

function openCount(r, reload) {
  var body = U.el('<div>' +
    '<p><strong>' + U.escapeHtml(r.medicineName) + '</strong> · Lot ' + U.escapeHtml(r.lot || '-') + '</p>' +
    '<p class="muted">ยอดในระบบ: ' + r.qty + '</p>' +
    '<div class="field"><label>จำนวนจริงที่นับได้</label><input id="c-actual" type="number" min="0" value="' + r.qty + '" /></div></div>');
  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">ปรับยอด</button>');
  footer.appendChild(ok);
  var m = Modal.open({ title: 'ตรวจนับสต็อก', body: body, footer: footer });
  ok.onclick = function () {
    var actual = Number(body.querySelector('#c-actual').value);
    if (!(actual >= 0)) { Toast.error('จำนวนไม่ถูกต้อง'); return; }
    ok.disabled = true;
    API.call('adjustCount', { payload: { stockId: r.stockId, actualQty: actual } })
      .then(function (d) { Toast.success('ปรับยอดแล้ว (' + (d.adjusted >= 0 ? '+' : '') + d.adjusted + ')'); m.close(); reload(); })
      .catch(function (e) { Toast.error(e.message); ok.disabled = false; });
  };
}

function openTransfer(r, locs, reload) {
  var options = locs.filter(function (l) { return l.id !== r.locationId; })
    .map(function (l) { return '<option value="' + l.id + '">' + U.escapeHtml(l.name) + '</option>'; }).join('');
  var body = U.el('<div>' +
    '<p><strong>' + U.escapeHtml(r.medicineName) + '</strong> · Lot ' + U.escapeHtml(r.lot || '-') + ' · คงเหลือ ' + r.qty + '</p>' +
    '<div class="field"><label>ย้ายไปยัง</label><select id="t-loc">' + options + '</select></div>' +
    '<div class="field"><label>จำนวน</label><input id="t-qty" type="number" min="1" max="' + r.qty + '" value="1" /></div></div>');
  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">ยืนยันการย้าย</button>');
  footer.appendChild(ok);
  var m = Modal.open({ title: 'ย้ายยา', body: body, footer: footer });
  ok.onclick = function () {
    var qty = Number(body.querySelector('#t-qty').value);
    var toLoc = body.querySelector('#t-loc').value;
    if (!(qty > 0) || qty > r.qty) { Toast.error('จำนวนไม่ถูกต้อง'); return; }
    if (!toLoc) { Toast.error('เลือกปลายทาง'); return; }
    ok.disabled = true;
    API.call('transfer', { payload: { stockId: r.stockId, toLocationId: toLoc, qty: qty } })
      .then(function () { Toast.success('ย้ายสำเร็จ'); m.close(); reload(); })
      .catch(function (e) { Toast.error(e.message); ok.disabled = false; });
  };
}
