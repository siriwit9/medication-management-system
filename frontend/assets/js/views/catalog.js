/** โครงสร้างคลัง: จัดการสถานที่ (ไอคอน/สี/จุดเริ่มต้นรับเข้า/ลากจัดลำดับ) + รายการยา */
window.Views = window.Views || {};

var ICON_CHOICES = ['package', 'pill', 'map-pin', 'box', 'archive', 'thermometer', 'snowflake', 'door-open', 'building', 'beaker', 'syringe', 'cross'];
var COLOR_CHOICES = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#ca8a04', '#7c3aed', '#0891b2', '#db2777', '#0f172a'];

Views.catalog = function (view) {
  view.innerHTML =
    '<div class="page-head"><h1 class="page-title">โครงสร้างคลัง</h1></div>' +
    '<div class="tabs"><div class="tab active" data-tab="locations">สถานที่เก็บยา</div><div class="tab" data-tab="medicines">รายการยา</div></div>' +
    '<div id="tab-content"></div>';

  var content = view.querySelector('#tab-content');
  view.querySelectorAll('[data-tab]').forEach(function (t) {
    t.onclick = function () {
      view.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      if (t.getAttribute('data-tab') === 'locations') renderLocations(content);
      else renderMedicines(content);
    };
  });
  return renderLocations(content);
};

/* ===== Locations ===== */
function renderLocations(content) {
  content.innerHTML = '<div class="loader">กำลังโหลด...</div>';
  return API.call('listLocations').then(function (locs) {
    content.innerHTML =
      '<div class="page-head"><span class="muted">ลากเพื่อจัดลำดับ</span>' +
      '<button class="btn btn-primary" id="add-loc"><span data-lucide="plus"></span> เพิ่มสถานที่</button></div>' +
      '<div id="loc-list"></div>';
    var list = content.querySelector('#loc-list');

    function draw() {
      list.innerHTML = locs.map(function (l) {
        return '<div class="list-item" draggable="true" data-id="' + l.id + '">' +
          '<span class="drag-handle" data-lucide="grip-vertical"></span>' +
          '<div class="loc-icon" style="width:40px;height:40px;background:' + U.escapeHtml(l.color) + '"><span data-lucide="' + U.escapeHtml(l.icon || 'package') + '"></span></div>' +
          '<div class="grow"><div class="title">' + U.escapeHtml(l.name) + (l.isReceivingDefault ? ' <span class="pill-tag tag-green">จุดรับเข้า</span>' : '') + '</div></div>' +
          '<button class="btn btn-sm" data-edit="' + l.id + '">แก้ไข</button> ' +
          '<button class="btn btn-sm btn-danger" data-del="' + l.id + '">ลบ</button></div>';
      }).join('') || '<div class="card empty-state">ยังไม่มีสถานที่</div>';
      U.refreshIcons();
      bindDrag();
      list.querySelectorAll('[data-edit]').forEach(function (b) {
        b.onclick = function () { locForm(locs.filter(function (x) { return x.id === b.getAttribute('data-edit'); })[0], function () { renderLocations(content); }); };
      });
      list.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () {
          Modal.confirm({ title: 'ลบสถานที่', message: 'ยืนยันลบสถานที่นี้?', danger: true, okText: 'ลบ' }).then(function (ok) {
            if (!ok) return;
            API.call('deleteLocation', { id: b.getAttribute('data-del') })
              .then(function () { Toast.success('ลบแล้ว'); renderLocations(content); })
              .catch(function (e) { Toast.error(e.message); });
          });
        };
      });
    }

    var dragEl = null;
    function bindDrag() {
      list.querySelectorAll('[draggable]').forEach(function (item) {
        item.addEventListener('dragstart', function () { dragEl = item; item.classList.add('dragging'); });
        item.addEventListener('dragend', function () {
          item.classList.remove('dragging');
          var ids = Array.prototype.map.call(list.children, function (c) { return c.getAttribute('data-id'); }).filter(Boolean);
          API.call('reorderLocations', { orderedIds: ids }).then(function () { Toast.success('จัดลำดับแล้ว'); });
        });
        item.addEventListener('dragover', function (e) {
          e.preventDefault();
          var after = getDragAfter(list, e.clientY);
          if (!dragEl) return;
          if (after == null) list.appendChild(dragEl); else list.insertBefore(dragEl, after);
        });
      });
    }
    function getDragAfter(container, y) {
      var els = Array.prototype.slice.call(container.querySelectorAll('[draggable]:not(.dragging)'));
      return els.reduce(function (closest, child) {
        var box = child.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        return closest;
      }, { offset: -Infinity }).element;
    }

    content.querySelector('#add-loc').onclick = function () { locForm(null, function () { renderLocations(content); }); };
    draw();
  });
}

function locForm(loc, onSaved) {
  loc = loc || { name: '', icon: 'package', color: '#2563eb', isReceivingDefault: false };
  var body = U.el('<div>' +
    '<div class="field"><label>ชื่อสถานที่ *</label><input id="l-name" value="' + U.escapeHtml(loc.name) + '" /></div>' +
    '<div class="field"><label>ไอคอน</label><div class="icon-pick" id="l-icons"></div></div>' +
    '<div class="field"><label>สี</label><div class="row" id="l-colors"></div></div>' +
    '<label class="field-inline"><input type="checkbox" id="l-recv" style="width:auto"' + (loc.isReceivingDefault ? ' checked' : '') + ' /> ตั้งเป็นจุดเริ่มต้นรับเข้า</label>' +
    '</div>');
  var picked = { icon: loc.icon || 'package', color: loc.color || '#2563eb' };

  var iconWrap = body.querySelector('#l-icons');
  iconWrap.innerHTML = ICON_CHOICES.map(function (ic) {
    return '<button type="button" class="' + (ic === picked.icon ? 'sel' : '') + '" data-ic="' + ic + '"><span data-lucide="' + ic + '"></span></button>';
  }).join('');
  iconWrap.querySelectorAll('[data-ic]').forEach(function (b) {
    b.onclick = function () { picked.icon = b.getAttribute('data-ic'); iconWrap.querySelectorAll('button').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); };
  });

  var colorWrap = body.querySelector('#l-colors');
  colorWrap.innerHTML = COLOR_CHOICES.map(function (c) {
    return '<div class="color-swatch" data-c="' + c + '" style="background:' + c + (c === picked.color ? ';outline:2px solid var(--text)' : '') + '"></div>';
  }).join('');
  colorWrap.querySelectorAll('[data-c]').forEach(function (s) {
    s.onclick = function () { picked.color = s.getAttribute('data-c'); colorWrap.querySelectorAll('.color-swatch').forEach(function (x) { x.style.outline = ''; }); s.style.outline = '2px solid var(--text)'; };
  });

  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">บันทึก</button>');
  footer.appendChild(ok);
  var m = Modal.open({ title: loc.id ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่', body: body, footer: footer });
  U.refreshIcons();

  ok.onclick = function () {
    var name = body.querySelector('#l-name').value.trim();
    if (!name) { Toast.error('กรุณาระบุชื่อ'); return; }
    ok.disabled = true;
    API.call('saveLocation', { location: { id: loc.id, name: name, icon: picked.icon, color: picked.color, isReceivingDefault: body.querySelector('#l-recv').checked } })
      .then(function () { Toast.success('บันทึกแล้ว'); m.close(); onSaved(); })
      .catch(function (e) { Toast.error(e.message); ok.disabled = false; });
  };
}

/* ===== Medicines ===== */
function renderMedicines(content) {
  content.innerHTML = '<div class="loader">กำลังโหลด...</div>';
  return Promise.all([API.call('listMedicines'), API.call('listLocations')]).then(function (res) {
    var meds = res[0], locs = res[1];
    content.innerHTML =
      '<div class="page-head"><input id="med-filter" placeholder="ค้นหายา..." style="max-width:280px" />' +
      '<button class="btn btn-primary" id="add-med"><span data-lucide="plus"></span> เพิ่มยา</button></div>' +
      '<div id="med-list"></div>';
    var listEl = content.querySelector('#med-list');

    function draw(filter) {
      var rows = meds.filter(function (m) { return !filter || m.name.toLowerCase().indexOf(filter) >= 0 || String(m.barcode).indexOf(filter) >= 0; });
      listEl.innerHTML = rows.length ? rows.map(function (m) {
        var img = m.imageFileId ? '<img class="med-thumb" data-img="' + m.imageFileId + '" alt="" />' : '<div class="med-thumb" style="display:grid;place-items:center"><span data-lucide="pill"></span></div>';
        return '<div class="list-item">' + img +
          '<div class="grow"><div class="title">' + U.escapeHtml(m.name) + (m.requireLot ? ' <span class="pill-tag tag-orange">บังคับ Lot</span>' : '') + '</div>' +
          '<div class="sub">บาร์โค้ด: ' + U.escapeHtml(m.barcode || '-') + ' · ขั้นต่ำ ' + m.minStock + ' ' + U.escapeHtml(m.unit || '') + '</div></div>' +
          '<button class="btn btn-sm" data-edit="' + m.id + '">แก้ไข</button> ' +
          '<button class="btn btn-sm btn-danger" data-del="' + m.id + '">ลบ</button></div>';
      }).join('') : '<div class="card empty-state">ไม่พบรายการยา</div>';
      U.refreshIcons();
      // โหลดรูปจาก Drive
      listEl.querySelectorAll('[data-img]').forEach(function (img) {
        API.call('getMedicineImage', { fileId: img.getAttribute('data-img') }).then(function (d) { img.src = d.dataUrl; }).catch(function () {});
      });
      listEl.querySelectorAll('[data-edit]').forEach(function (b) {
        b.onclick = function () { medForm(meds.filter(function (x) { return x.id === b.getAttribute('data-edit'); })[0], locs, function () { renderMedicines(content); }); };
      });
      listEl.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () {
          Modal.confirm({ title: 'ลบยา', message: 'ยืนยันลบรายการยานี้?', danger: true, okText: 'ลบ' }).then(function (ok) {
            if (!ok) return;
            API.call('deleteMedicine', { id: b.getAttribute('data-del') })
              .then(function () { Toast.success('ลบแล้ว'); renderMedicines(content); })
              .catch(function (e) { Toast.error(e.message); });
          });
        };
      });
    }

    content.querySelector('#med-filter').addEventListener('input', U.debounce(function (e) { draw(e.target.value.trim().toLowerCase()); }, 250));
    content.querySelector('#add-med').onclick = function () { medForm(null, locs, function () { renderMedicines(content); }); };
    draw('');
  });
}

function medForm(med, locs, onSaved) {
  med = med || { name: '', barcode: '', unit: '', minStock: 0, requireLot: true, defaultLocationId: '', imageFileId: '' };
  var pendingImage = null;
  var body = U.el('<div>' +
    '<div class="field"><label>ชื่อยา *</label><input id="m-name" value="' + U.escapeHtml(med.name) + '" /></div>' +
    '<div class="field"><label>บาร์โค้ด</label><input id="m-barcode" value="' + U.escapeHtml(med.barcode || '') + '" /></div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>หน่วย</label><input id="m-unit" value="' + U.escapeHtml(med.unit || '') + '" placeholder="เม็ด/ขวด/แผง" /></div>' +
    '<div class="field"><label>ขั้นต่ำสต็อก</label><input id="m-min" type="number" min="0" value="' + (med.minStock || 0) + '" /></div></div>' +
    '<div class="field"><label>จุดเก็บเริ่มต้น</label><select id="m-loc"><option value="">- ไม่ระบุ -</option>' +
    locs.map(function (l) { return '<option value="' + l.id + '"' + (l.id === med.defaultLocationId ? ' selected' : '') + '>' + U.escapeHtml(l.name) + '</option>'; }).join('') + '</select></div>' +
    '<label class="field-inline"><input type="checkbox" id="m-lot" style="width:auto"' + (med.requireLot ? ' checked' : '') + ' /> บังคับกรอก Lot + วันหมดอายุ</label>' +
    '<div class="field"><label>รูปภาพยา (เก็บใน Google Drive)</label><input id="m-img" type="file" accept="image/*" /><div id="m-img-preview" class="mt-16"></div></div>' +
    '</div>');

  var preview = body.querySelector('#m-img-preview');
  if (med.imageFileId) {
    API.call('getMedicineImage', { fileId: med.imageFileId }).then(function (d) { preview.innerHTML = '<img class="med-thumb" style="width:80px;height:80px" src="' + d.dataUrl + '" />'; }).catch(function () {});
  }
  body.querySelector('#m-img').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    U.fileToDataUrl(file).then(function (dataUrl) {
      pendingImage = { dataUrl: dataUrl, filename: file.name };
      preview.innerHTML = '<img class="med-thumb" style="width:80px;height:80px" src="' + dataUrl + '" />';
    });
  });

  var footer = U.el('<div></div>');
  var ok = U.el('<button class="btn btn-primary">บันทึก</button>');
  footer.appendChild(ok);
  var m = Modal.open({ title: med.id ? 'แก้ไขยา' : 'เพิ่มยา', body: body, footer: footer, wide: true });

  ok.onclick = function () {
    var payload = {
      id: med.id,
      name: body.querySelector('#m-name').value.trim(),
      barcode: body.querySelector('#m-barcode').value.trim(),
      unit: body.querySelector('#m-unit').value.trim(),
      minStock: Number(body.querySelector('#m-min').value || 0),
      requireLot: body.querySelector('#m-lot').checked,
      defaultLocationId: body.querySelector('#m-loc').value
    };
    if (!payload.name) { Toast.error('กรุณาระบุชื่อยา'); return; }
    ok.disabled = true; ok.textContent = 'กำลังบันทึก...';
    API.call('saveMedicine', { medicine: payload }).then(function (r) {
      if (pendingImage) {
        return API.call('uploadMedicineImage', { medicineId: r.id, dataUrl: pendingImage.dataUrl, filename: pendingImage.filename });
      }
    }).then(function () {
      Toast.success('บันทึกแล้ว'); m.close(); onSaved();
    }).catch(function (e) { Toast.error(e.message); ok.disabled = false; ok.textContent = 'บันทึก'; });
  };
}
