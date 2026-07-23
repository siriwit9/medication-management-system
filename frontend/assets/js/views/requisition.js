/** ระบบใบเบิกยา: สร้าง/ดู/พิมพ์ PDF ตามแบบฟอร์มราชการ */
window.Views = window.Views || {};
Views.requisition = function (view) {
  var state = { reqs: [], meds: [], stockTotals: {} };

  return Promise.all([
    API.call('listRequisitions'),
    API.call('listMedicines'),
    API.call('exportRows', { kind: 'stock', filters: {} })
  ]).then(function (res) {
    state.reqs = res[0];
    state.meds = res[1];
    // คำนวณยอดคงเหลือรวม
    (res[2].rows || []).forEach(function (r) {
      var name = r[0];
      var med = state.meds.filter(function (m) { return m.name === name; })[0];
      if (med) state.stockTotals[med.id] = (state.stockTotals[med.id] || 0) + Number(r[5] || 0);
    });
    renderList();
  });

  function renderList() {
    var statusLabel = { draft: 'แบบร่าง', approved: 'อนุมัติแล้ว', completed: 'เสร็จสิ้น' };
    var statusClass = { draft: 'tag-yellow', approved: 'tag-green', completed: 'tag-blue' };
    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">ใบเบิกยา</h1>' +
      '<button class="btn btn-primary" id="req-new"><span data-lucide="plus"></span> สร้างใบเบิกใหม่</button></div>' +
      '<div id="req-list">' +
      (state.reqs.length === 0 ? '<div class="card empty-state">ยังไม่มีใบเบิกยา</div>' :
        '<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ผู้เบิก</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>' +
        state.reqs.map(function (r) {
          return '<tr><td><strong>' + U.escapeHtml(r.reqNumber) + '</strong></td>' +
            '<td>' + U.thaiDate(r.reqDate) + '</td>' +
            '<td>' + U.escapeHtml(r.requesterName || '-') + '</td>' +
            '<td><span class="pill-tag ' + (statusClass[r.status] || '') + '">' + (statusLabel[r.status] || r.status) + '</span></td>' +
            '<td><button class="btn btn-sm" data-view="' + r.id + '">ดู/แก้ไข</button> ' +
            '<button class="btn btn-sm" data-print="' + r.id + '"><span data-lucide="printer"></span></button> ' +
            '<button class="btn btn-sm btn-danger" data-del="' + r.id + '"><span data-lucide="trash-2"></span></button></td></tr>';
        }).join('') + '</tbody></table></div>') + '</div>';
    U.refreshIcons();

    view.querySelector('#req-new').onclick = function () { renderForm(null); };
    view.querySelectorAll('[data-view]').forEach(function (b) {
      b.onclick = function () { loadAndEdit(b.getAttribute('data-view')); };
    });
    view.querySelectorAll('[data-print]').forEach(function (b) {
      b.onclick = function () { printRequisition(b.getAttribute('data-print')); };
    });
    view.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        Modal.confirm({ title: 'ลบใบเบิก', message: 'ยืนยันลบใบเบิกนี้?', danger: true, okText: 'ลบ' }).then(function (ok) {
          if (!ok) return;
          API.call('deleteRequisition', { id: b.getAttribute('data-del') }).then(function () {
            Toast.success('ลบแล้ว');
            return API.call('listRequisitions');
          }).then(function (r) { state.reqs = r; renderList(); }).catch(function (e) { Toast.error(e.message); });
        });
      };
    });
  }

  function loadAndEdit(id) {
    API.call('getRequisition', { id: id }).then(function (r) { renderForm(r); }).catch(function (e) { Toast.error(e.message); });
  }

  function renderForm(existing) {
    var settings = App.getSettingsCache() || {};
    var isEdit = !!existing;
    var items = isEdit ? existing.items : [];

    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">' + (isEdit ? 'แก้ไขใบเบิก ' + U.escapeHtml(existing.reqNumber) : 'สร้างใบเบิกใหม่') + '</h1>' +
      '<button class="btn" id="req-back"><span data-lucide="arrow-left"></span> กลับ</button></div>' +
      '<div class="card mb-16">' +
      '<div class="grid grid-2">' +
      '<div class="field"><label>วันที่เบิก</label><input id="req-date" type="date" value="' + (isEdit ? existing.reqDate : U.todayISO()) + '" /></div>' +
      '<div class="field"><label>สถานะ</label><select id="req-status">' +
      '<option value="draft"' + (isEdit && existing.status === 'draft' ? ' selected' : '') + '>แบบร่าง</option>' +
      '<option value="approved"' + (isEdit && existing.status === 'approved' ? ' selected' : '') + '>อนุมัติแล้ว</option>' +
      '<option value="completed"' + (isEdit && existing.status === 'completed' ? ' selected' : '') + '>เสร็จสิ้น</option></select></div>' +
      '<div class="field"><label>ผู้เบิก</label><input id="req-requester" value="' + U.escapeHtml(isEdit ? existing.requesterName : '') + '" placeholder="ชื่อ-สกุล ผู้เบิก" /></div>' +
      '<div class="field"><label>ผู้อนุมัติจ่าย</label><input id="req-approver" value="' + U.escapeHtml(isEdit ? existing.approverName : '') + '" placeholder="ชื่อ-สกุล ผู้อนุมัติ" /></div>' +
      '<div class="field"><label>ผู้จ่าย</label><input id="req-distributor" value="' + U.escapeHtml(isEdit ? existing.distributorName : '') + '" placeholder="ชื่อ-สกุล ผู้จ่าย" /></div>' +
      '<div class="field"><label>ผู้รับของ</label><input id="req-receiver" value="' + U.escapeHtml(isEdit ? existing.receiverName : '') + '" placeholder="ชื่อ-สกุล ผู้รับของ" /></div>' +
      '</div>' +
      '<div class="field"><label>หมายเหตุ</label><input id="req-note" value="' + U.escapeHtml(isEdit ? (existing.note || '') : '') + '" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" /></div>' +
      '</div>' +

      '<div class="card mb-16">' +
      '<h3>รายการยา</h3>' +
      '<div class="field"><label>เพิ่มยา</label><div class="row"><input id="req-med-search" placeholder="พิมพ์ชื่อยาเพื่อค้นหา" style="flex:1" />' +
      '</div></div>' +
      '<div id="req-med-suggest"></div>' +
      '<div id="req-items-list"></div>' +
      '</div>' +
      '<div class="row"><button class="btn btn-primary" id="req-save"><span data-lucide="save"></span> บันทึกใบเบิก</button>' +
      (isEdit ? ' <button class="btn" id="req-print"><span data-lucide="printer"></span> พิมพ์ PDF</button>' : '') + '</div>';
    U.refreshIcons();

    // state สำหรับฟอร์ม
    var formItems = items.map(function (it) {
      return { medicineId: it.medicineId, medicineName: it.medicineName, unit: it.unit,
        qtyRequested: it.qtyRequested, qtyApproved: it.qtyApproved,
        qtyRemaining: state.stockTotals[it.medicineId] || it.qtyRemaining, note: it.note };
    });

    renderItemsTable();

    // ค้นหายา
    var searchInput = view.querySelector('#req-med-search');
    var suggestBox = view.querySelector('#req-med-suggest');
    searchInput.addEventListener('input', U.debounce(function () {
      var q = searchInput.value.trim().toLowerCase();
      if (!q) { suggestBox.innerHTML = ''; return; }
      var matches = state.meds.filter(function (m) {
        return m.name.toLowerCase().indexOf(q) >= 0 || String(m.barcode).indexOf(q) >= 0;
      }).slice(0, 8);
      suggestBox.innerHTML = matches.map(function (m, i) {
        return '<div class="list-item card-clickable" data-mi="' + i + '"><div class="grow"><div class="title">' +
          U.escapeHtml(m.name) + '</div><div class="sub">' + U.escapeHtml(m.unit || '') +
          ' · คงเหลือ: ' + (state.stockTotals[m.id] || 0) + '</div></div></div>';
      }).join('');
      suggestBox.querySelectorAll('[data-mi]').forEach(function (el) {
        el.onclick = function () {
          var m = matches[Number(el.getAttribute('data-mi'))];
          // เช็คซ้ำ
          var dup = formItems.filter(function (x) { return x.medicineId === m.id; });
          if (dup.length) { Toast.error('มียานี้ในรายการแล้ว'); return; }
          formItems.push({
            medicineId: m.id, medicineName: m.name, unit: m.unit || '',
            qtyRequested: 1, qtyApproved: 1,
            qtyRemaining: state.stockTotals[m.id] || 0, note: ''
          });
          suggestBox.innerHTML = '';
          searchInput.value = '';
          renderItemsTable();
        };
      });
    }, 200));

    function renderItemsTable() {
      var box = view.querySelector('#req-items-list');
      if (!formItems.length) { box.innerHTML = '<p class="muted">ยังไม่มีรายการ — ค้นหายาด้านบนเพื่อเพิ่ม</p>'; return; }
      box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>#</th><th>รายการ</th><th>หน่วย</th><th>ขอเบิก</th><th>อนุมัติ</th><th>คงเหลือ</th><th>หมายเหตุ</th><th></th></tr></thead><tbody>' +
        formItems.map(function (it, idx) {
          return '<tr><td>' + (idx + 1) + '</td><td>' + U.escapeHtml(it.medicineName) + '</td><td>' + U.escapeHtml(it.unit) + '</td>' +
            '<td><input type="number" min="0" value="' + it.qtyRequested + '" data-field="qtyRequested" data-idx="' + idx + '" style="width:70px" /></td>' +
            '<td><input type="number" min="0" value="' + it.qtyApproved + '" data-field="qtyApproved" data-idx="' + idx + '" style="width:70px" /></td>' +
            '<td>' + it.qtyRemaining + '</td>' +
            '<td><input value="' + U.escapeHtml(it.note) + '" data-field="note" data-idx="' + idx + '" style="width:80px" placeholder="-" /></td>' +
            '<td><button class="btn btn-sm btn-danger" data-rm="' + idx + '"><span data-lucide="x"></span></button></td></tr>';
        }).join('') +
        '<tr><td colspan="3" style="text-align:right"><strong>รวมทั้งหมด ' + formItems.length + ' รายการ</strong></td><td colspan="5"></td></tr>' +
        '</tbody></table></div>';
      U.refreshIcons();

      // bind inputs
      box.querySelectorAll('[data-field]').forEach(function (inp) {
        inp.onchange = function () {
          var idx = Number(inp.getAttribute('data-idx'));
          var field = inp.getAttribute('data-field');
          formItems[idx][field] = field === 'note' ? inp.value : Number(inp.value);
        };
      });
      box.querySelectorAll('[data-rm]').forEach(function (b) {
        b.onclick = function () { formItems.splice(Number(b.getAttribute('data-rm')), 1); renderItemsTable(); };
      });
    }

    view.querySelector('#req-back').onclick = function () {
      API.call('listRequisitions').then(function (r) { state.reqs = r; renderList(); });
    };
    view.querySelector('#req-save').onclick = function () { doSave(); };
    if (isEdit && view.querySelector('#req-print')) {
      view.querySelector('#req-print').onclick = function () { printRequisition(existing.id); };
    }

    function doSave() {
      if (!formItems.length) { Toast.error('ต้องมีรายการยาอย่างน้อย 1 รายการ'); return; }
      var btn = view.querySelector('#req-save'); btn.disabled = true;
      var payload = {
        id: isEdit ? existing.id : undefined,
        reqDate: view.querySelector('#req-date').value,
        requesterName: view.querySelector('#req-requester').value.trim(),
        approverName: view.querySelector('#req-approver').value.trim(),
        distributorName: view.querySelector('#req-distributor').value.trim(),
        receiverName: view.querySelector('#req-receiver').value.trim(),
        status: view.querySelector('#req-status').value,
        note: view.querySelector('#req-note').value.trim(),
        items: formItems.map(function (it) {
          return { medicineId: it.medicineId, qtyRequested: it.qtyRequested, qtyApproved: it.qtyApproved, note: it.note || '' };
        })
      };
      API.call('saveRequisition', { requisition: payload }).then(function (r) {
        Toast.success('บันทึกใบเบิก ' + (r.reqNumber || '') + ' แล้ว');
        return API.call('listRequisitions');
      }).then(function (r) { state.reqs = r; renderList(); })
        .catch(function (e) { Toast.error(e.message); })
        .finally(function () { btn.disabled = false; });
    }
  }

  // ===== พิมพ์ PDF ตามแบบฟอร์มราชการ =====
  function printRequisition(id) {
    API.call('getRequisition', { id: id }).then(function (req) {
      var settings = App.getSettingsCache() || {};
      var hospitalName = settings.hospitalName || 'โรงพยาบาลส่งเสริมสุขภาพประจำตำบล';

      if (!window.jspdf || !window.jspdf.jsPDF) { Toast.error('โหลดไลบรารี PDF ไม่สำเร็จ'); return; }
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // ฝังฟอนต์ไทย
      var useThai = false;
      if (window.THAI_FONT_BASE64) {
        try {
          doc.addFileToVFS('Sarabun.ttf', window.THAI_FONT_BASE64);
          doc.addFont('Sarabun.ttf', 'Sarabun', 'normal');
          doc.setFont('Sarabun');
          useThai = true;
        } catch (e) {}
      }
      var font = useThai ? 'Sarabun' : 'helvetica';

      // แปลงวันที่เป็น พ.ศ.
      var dateParts = String(req.reqDate).split('-');
      var thaiMonths = ['', 'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
        'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
      var dateStr = dateParts.length === 3
        ? 'วันที่ ' + Number(dateParts[2]) + ' เดือน ' + (thaiMonths[Number(dateParts[1])] || '') + ' พ.ศ. ' + (Number(dateParts[0]) + 543)
        : req.reqDate;

      var y = 20;
      doc.setFontSize(18);
      doc.text('ใบเบิกยา', 105, y, { align: 'center' }); y += 8;
      doc.setFontSize(14);
      doc.text(hospitalName, 105, y, { align: 'center' }); y += 8;
      doc.setFontSize(11);
      doc.text(dateStr, 105, y, { align: 'center' }); y += 10;

      doc.text('เรื่อง  ขอ เบิก ยา', 20, y); y += 7;
      doc.text('เรียน  ผู้อำนวยการ' + hospitalName, 20, y); y += 7;
      doc.text('     ด้วย งานรักษาพยาบาล มีความประสงค์จะขอเบิกยาจากคลังยา ของ ' + hospitalName + ' ตามรายการดังนี้', 20, y); y += 6;

      // ตาราง
      var tableRows = req.items.map(function (it, idx) {
        return [String(idx + 1), it.medicineName, it.unit, String(it.qtyRequested), String(it.qtyApproved), String(it.qtyRemaining), it.note || ''];
      });

      doc.autoTable({
        head: [['ลำดับที่', 'รายการ', 'หน่วยนับ', 'จำนวนขอเบิก', 'จำนวนอนุมัติ', 'คงเหลือ', 'หมายเหตุ']],
        body: tableRows,
        startY: y,
        styles: { font: font, fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 22 },
          4: { halign: 'center', cellWidth: 22 },
          5: { halign: 'center', cellWidth: 18 },
          6: { cellWidth: 22 }
        },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.text('รวมทั้งหมด.....' + req.items.length + '.....รายการ', 130, y); y += 10;
      doc.text('จึงเรียนมาเพื่อโปรดอนุมัติ', 20, y); y += 18;

      // ลายเซ็น 4 ช่อง (2 แถว × 2 คอลัมน์)
      var signY = y;
      var leftX = 25;
      var rightX = 115;

      doc.text('ลงชื่อ.................................................ผู้เบิก', leftX, signY);
      doc.text('ลงชื่อ.................................................ผู้อนุมัติจ่าย', rightX, signY);
      signY += 7;
      if (req.requesterName) doc.text('( ' + req.requesterName + ' )', leftX + 15, signY);
      if (req.approverName) doc.text('( ' + req.approverName + ' )', rightX + 15, signY);
      signY += 14;

      doc.text('ลงชื่อ.................................................ผู้จ่าย', leftX, signY);
      doc.text('ลงชื่อ.................................................ผู้รับของ', rightX, signY);
      signY += 7;
      if (req.distributorName) doc.text('( ' + req.distributorName + ' )', leftX + 15, signY);
      if (req.receiverName) doc.text('( ' + req.receiverName + ' )', rightX + 15, signY);

      doc.save('ใบเบิกยา_' + req.reqNumber + '.pdf');
      Toast.success('สร้าง PDF เรียบร้อย');
    }).catch(function (e) { Toast.error(e.message); });
  }
};
