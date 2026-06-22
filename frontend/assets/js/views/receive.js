/** รับเข้ายา: ยิงบาร์โค้ด HID / กล้อง / เลือกรายการ -> Lot -> วันหมดอายุ -> จำนวน -> สถานที่ */
window.Views = window.Views || {};
Views.receive = function (view) {
  var state = { meds: [], locs: [], selected: null, todayRows: [] };

  return Promise.all([
    API.call('listMedicines'),
    API.call('listLocations')
  ]).then(function (res) {
    state.meds = res[0];
    state.locs = res[1];
    var defaultLoc = state.locs.filter(function (l) { return l.isReceivingDefault; })[0] || state.locs[0];

    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">รับเข้ายา</h1>' +
      '<button class="btn btn-primary" id="export-today"><span data-lucide="file-spreadsheet"></span> ส่งออกวันนี้</button></div>' +
      '<div class="card mb-16">' +
      '<div class="field"><label>เลือกยา (ยิงบาร์โค้ด / สแกนกล้อง / พิมพ์ค้นหา)</label>' +
      '<div class="row"><input id="barcode-input" placeholder="ยิงบาร์โค้ดที่นี่ แล้วกด Enter หรือพิมพ์ชื่อยา" style="flex:1;min-width:220px" autofocus />' +
      '<button class="btn" id="cam-btn"><span data-lucide="camera"></span> กล้อง</button></div></div>' +
      '<div id="med-suggest"></div>' +
      '<div id="selected-med" class="mb-16"></div>' +
      '<div id="receive-form"></div>' +
      '</div>' +
      '<h2 class="page-title" style="font-size:18px">รับเข้าล่าสุด (วันนี้)</h2>' +
      '<div id="today-list"></div>';

    var barcodeInput = view.querySelector('#barcode-input');
    var suggest = view.querySelector('#med-suggest');

    function selectMed(med) {
      state.selected = med;
      suggest.innerHTML = '';
      barcodeInput.value = '';
      renderSelected();
      renderForm();
    }

    function findByBarcode(code) {
      var m = state.meds.filter(function (x) { return String(x.barcode) === String(code); })[0];
      if (m) { selectMed(m); Toast.success('เลือก: ' + m.name); }
      else { Toast.error('ไม่พบยาบาร์โค้ด ' + code); }
    }

    Scanner.attachHidInput(barcodeInput, function (code) {
      // ถ้าตรงบาร์โค้ดเป๊ะ -> เลือกเลย ไม่งั้นถือเป็นคำค้น
      var exact = state.meds.filter(function (x) { return String(x.barcode) === String(code); })[0];
      if (exact) findByBarcode(code); else renderSuggest(code);
    });
    barcodeInput.addEventListener('input', U.debounce(function () {
      renderSuggest(barcodeInput.value.trim());
    }, 200));
    view.querySelector('#cam-btn').onclick = function () { Scanner.openCamera(findByBarcode); };

    function renderSuggest(q) {
      q = (q || '').toLowerCase();
      if (!q) { suggest.innerHTML = ''; return; }
      var matches = state.meds.filter(function (m) {
        return m.name.toLowerCase().indexOf(q) >= 0 || String(m.barcode).indexOf(q) >= 0;
      }).slice(0, 8);
      suggest.innerHTML = matches.map(function (m, i) {
        return '<div class="list-item card-clickable" data-i="' + i + '"><div class="grow"><div class="title">' +
          U.escapeHtml(m.name) + '</div><div class="sub">บาร์โค้ด: ' + U.escapeHtml(m.barcode || '-') +
          (m.requireLot ? ' · บังคับ Lot' : '') + '</div></div></div>';
      }).join('');
      suggest.querySelectorAll('[data-i]').forEach(function (el) {
        el.onclick = function () { selectMed(matches[Number(el.getAttribute('data-i'))]); };
      });
    }

    function renderSelected() {
      var m = state.selected;
      var box = view.querySelector('#selected-med');
      if (!m) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="list-item" style="background:#eff6ff;border-color:var(--primary)">' +
        '<span data-lucide="pill"></span><div class="grow"><div class="title">' + U.escapeHtml(m.name) + '</div>' +
        '<div class="sub">' + (m.requireLot ? 'ต้องระบุ Lot + วันหมดอายุ' : 'ไม่บังคับ Lot') + '</div></div></div>';
      U.refreshIcons();
    }

    function renderForm() {
      var m = state.selected;
      var box = view.querySelector('#receive-form');
      if (!m) { box.innerHTML = ''; return; }
      box.innerHTML =
        '<div class="grid grid-2">' +
        '<div class="field"><label>Lot' + (m.requireLot ? ' *' : '') + '</label><input id="r-lot" placeholder="หมายเลข Lot" /></div>' +
        '<div class="field"><label>วันหมดอายุ' + (m.requireLot ? ' *' : '') + '</label><input id="r-exp" type="date" /></div>' +
        '<div class="field"><label>จำนวน *</label><div class="qty-stepper"><button class="btn" id="q-minus">-</button>' +
        '<input id="r-qty" type="number" min="1" value="1" /><button class="btn" id="q-plus">+</button> <span class="muted">' + U.escapeHtml(m.unit || '') + '</span></div></div>' +
        '<div class="field"><label>สถานที่ *</label><select id="r-loc">' +
        state.locs.map(function (l) {
          return '<option value="' + l.id + '"' + (defaultLoc && l.id === defaultLoc.id ? ' selected' : '') + '>' + U.escapeHtml(l.name) + '</option>';
        }).join('') + '</select></div></div>' +
        '<button class="btn btn-primary btn-block" id="r-save"><span data-lucide="save"></span> บันทึกรับเข้า</button>';
      U.refreshIcons();

      box.querySelector('#q-minus').onclick = function () { var q = box.querySelector('#r-qty'); q.value = Math.max(1, Number(q.value) - 1); };
      box.querySelector('#q-plus').onclick = function () { var q = box.querySelector('#r-qty'); q.value = Number(q.value) + 1; };
      box.querySelector('#r-save').onclick = doSave;
    }

    function doSave() {
      var m = state.selected;
      var lot = view.querySelector('#r-lot').value.trim();
      var exp = view.querySelector('#r-exp').value;
      var qty = Number(view.querySelector('#r-qty').value);
      var locId = view.querySelector('#r-loc').value;
      if (m.requireLot && (!lot || !exp)) { Toast.error('รายการนี้ต้องระบุ Lot และวันหมดอายุ'); return; }
      if (!(qty > 0)) { Toast.error('จำนวนต้องมากกว่า 0'); return; }

      var btn = view.querySelector('#r-save');
      btn.disabled = true;
      API.call('receive', { payload: { medicineId: m.id, locationId: locId, lot: lot, expiryDate: exp, qty: qty } })
        .then(function () {
          Toast.success('รับเข้า ' + m.name + ' จำนวน ' + qty);
          state.todayRows.unshift({
            name: m.name, lot: lot, exp: exp, qty: qty,
            locName: (state.locs.filter(function (l) { return l.id === locId; })[0] || {}).name || '',
            unit: m.unit || '', time: new Date().toISOString()
          });
          renderToday();
          state.selected = null;
          renderSelected(); renderForm();
          view.querySelector('#barcode-input').focus();
        })
        .catch(function (e) { Toast.error(e.message); })
        .finally(function () { btn.disabled = false; });
    }

    function renderToday() {
      var box = view.querySelector('#today-list');
      if (!state.todayRows.length) { box.innerHTML = '<div class="card empty-state">ยังไม่มีการรับเข้าวันนี้</div>'; return; }
      box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>เวลา</th><th>ชื่อยา</th><th>Lot</th><th>วันหมดอายุ</th><th>จำนวน</th><th>สถานที่</th></tr></thead><tbody>' +
        state.todayRows.map(function (r) {
          return '<tr><td>' + U.thaiDateTime(r.time) + '</td><td>' + U.escapeHtml(r.name) + '</td><td>' + U.escapeHtml(r.lot || '-') +
            '</td><td>' + U.thaiDate(r.exp) + '</td><td>' + r.qty + ' ' + U.escapeHtml(r.unit) + '</td><td>' + U.escapeHtml(r.locName) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    view.querySelector('#export-today').onclick = function () {
      if (!state.todayRows.length) { Toast.error('ยังไม่มีรายการรับเข้าวันนี้'); return; }
      var aoa = [['เวลา', 'ชื่อยา', 'Lot', 'วันหมดอายุ', 'จำนวน', 'หน่วย', 'สถานที่']];
      state.todayRows.forEach(function (r) {
        aoa.push([U.thaiDateTime(r.time), r.name, r.lot, r.exp ? U.thaiDate(r.exp) : '', r.qty, r.unit, r.locName]);
      });
      Exporter.toXlsx(aoa, 'รับเข้า_' + U.todayISO(), 'รับเข้าวันนี้');
    };

    renderToday();
    U.refreshIcons();
  });
};
