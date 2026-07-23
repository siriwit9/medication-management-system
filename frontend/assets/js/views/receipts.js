/**
 * ระบบใบเสร็จ / ใบจ่ายยา: ออกใบเสร็จ, ตัดสต็อกอัตโนมัติ, พิมพ์ PDF
 */
window.Views = window.Views || {};
Views.receipts = function (view) {
  var state = { receipts: [], meds: [], stockTotals: {} };

  return Promise.all([
    API.call('listReceipts').catch(function () { return []; }),
    API.call('listMedicines').catch(function () { return []; }),
    API.call('exportRows', { kind: 'stock' }).catch(function () { return { rows: [] }; })
  ]).then(function (res) {
    state.receipts = res[0];
    state.meds = res[1];
    (res[2].rows || []).forEach(function (r) {
      var name = r[0];
      var med = state.meds.filter(function (m) { return m.name === name; })[0];
      if (med) state.stockTotals[med.id] = (state.stockTotals[med.id] || 0) + Number(r[5] || 0);
    });
    renderList();
  });

  function renderList() {
    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">ใบเสร็จ / ใบจ่ายยา</h1>' +
      '<button class="btn btn-primary" id="rec-new"><span data-lucide="plus"></span> ออกใบเสร็จใหม่</button></div>' +
      '<div id="rec-list">' +
      (state.receipts.length === 0 ? '<div class="card empty-state">ยังไม่มีรายการใบเสร็จจ่ายยา</div>' :
        '<div class="table-wrap"><table><thead><tr><th>เลขที่ใบเสร็จ</th><th>วันที่</th><th>ผู้ป่วย/ผู้รับยา</th><th>สิทธิ</th><th>ยอดรวม (บาท)</th><th>ผู้จ่ายยา</th><th>จัดการ</th></tr></thead><tbody>' +
        state.receipts.map(function (r) {
          return '<tr><td><strong>' + U.escapeHtml(r.receiptNumber) + '</strong></td>' +
            '<td>' + U.thaiDate(r.receiptDate) + '</td>' +
            '<td>' + U.escapeHtml(r.patientName || '-') + '</td>' +
            '<td><span class="pill-tag tag-blue">' + U.escapeHtml(r.privilege || 'ทั่วไป') + '</span></td>' +
            '<td>' + Number(r.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) + '</td>' +
            '<td>' + U.escapeHtml(r.dispenserName || '-') + '</td>' +
            '<td><button class="btn btn-sm" data-view="' + r.id + '">ดูรายละเอียด</button> ' +
            '<button class="btn btn-sm" data-print="' + r.id + '"><span data-lucide="printer"></span> พิมพ์</button> ' +
            '<button class="btn btn-sm btn-danger" data-del="' + r.id + '"><span data-lucide="trash-2"></span></button></td></tr>';
        }).join('') + '</tbody></table></div>') + '</div>';
    U.refreshIcons();

    view.querySelector('#rec-new').onclick = function () { renderForm(null); };
    view.querySelectorAll('[data-view]').forEach(function (b) {
      b.onclick = function () { loadAndEdit(b.getAttribute('data-view')); };
    });
    view.querySelectorAll('[data-print]').forEach(function (b) {
      b.onclick = function () { printReceipt(b.getAttribute('data-print')); };
    });
    view.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        Modal.confirm({ title: 'ลบใบเสร็จ', message: 'ยืนยันลบใบเสร็จนี้?', danger: true, okText: 'ลบ' }).then(function (ok) {
          if (!ok) return;
          API.call('deleteReceipt', { id: b.getAttribute('data-del') }).then(function () {
            Toast.success('ลบใบเสร็จเรียบร้อย');
            return API.call('listReceipts');
          }).then(function (r) { state.receipts = r; renderList(); }).catch(function (e) { Toast.error(e.message); });
        });
      };
    });
  }

  function loadAndEdit(id) {
    API.call('getReceipt', { id: id }).then(function (r) { renderForm(r); }).catch(function (e) { Toast.error(e.message); });
  }

  function renderForm(existing) {
    var isEdit = !!existing;
    var user = Auth.getUser() || {};
    var items = isEdit ? existing.items : [];

    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">' + (isEdit ? 'ใบเสร็จเลขที่ ' + U.escapeHtml(existing.receiptNumber) : 'ออกใบเสร็จจ่ายยาใหม่') + '</h1>' +
      '<button class="btn" id="rec-back"><span data-lucide="arrow-left"></span> กลับ</button></div>' +
      '<div class="card mb-16">' +
      '<div class="grid grid-2">' +
      '<div class="field"><label>วันที่จ่ายยา</label><input id="rec-date" type="date" value="' + (isEdit ? existing.receiptDate : U.todayISO()) + '" /></div>' +
      '<div class="field"><label>สิทธิการรักษา</label><select id="rec-privilege">' +
      '<option value="บัตรทอง 30 บาท"' + (isEdit && existing.privilege === 'บัตรทอง 30 บาท' ? ' selected' : '') + '>บัตรทอง 30 บาท</option>' +
      '<option value="จ่ายตรง / เบิกได้"' + (isEdit && existing.privilege === 'จ่ายตรง / เบิกได้' ? ' selected' : '') + '>จ่ายตรง / เบิกได้</option>' +
      '<option value="ชำระเงินสด"' + (isEdit && existing.privilege === 'ชำระเงินสด' ? ' selected' : '') + '>ชำระเงินสด</option>' +
      '<option value="ยกเว้นค่าบริการ"' + (isEdit && existing.privilege === 'ยกเว้นค่าบริการ' ? ' selected' : '') + '>ยกเว้นค่าบริการ</option></select></div>' +
      '<div class="field"><label>ชื่อ-นามสกุล ผู้ป่วย/ผู้รับยา</label><input id="rec-patient" value="' + U.escapeHtml(isEdit ? existing.patientName : '') + '" placeholder="เช่น นายสมชาย ใจดี" /></div>' +
      '<div class="field"><label>เลข HN / เลขบัตรประชาชน</label><input id="rec-hn" value="' + U.escapeHtml(isEdit ? existing.patientHn : '') + '" placeholder="เช่น 66000123" /></div>' +
      '<div class="field"><label>ผู้จ่ายยา / เภสัชกร</label><input id="rec-dispenser" value="' + U.escapeHtml(isEdit ? existing.dispenserName : (user.full_name || user.username || '')) + '" placeholder="ชื่อผู้จ่ายยา" /></div>' +
      '<div class="field"><label>หมายเหตุ</label><input id="rec-note" value="' + U.escapeHtml(isEdit ? existing.note : '') + '" placeholder="หมายเหตุเพิ่มเติม" /></div>' +
      '</div></div>' +

      '<div class="card mb-16">' +
      '<h3>รายการยาที่จ่าย</h3>' +
      (isEdit ? '' : '<div class="field"><label>เพิ่มรายการยา</label><input id="rec-med-search" placeholder="พิมพ์ชื่อยา หรือสแกนบาร์โค้ด" style="width:100%" /><div id="rec-med-suggest"></div></div>') +
      '<div id="rec-items-list"></div>' +
      '<div class="row style="margin-top:16px"><div style="flex:1"></div><h3 id="rec-grand-total">ยอดรวมทั้งสิ้น: 0.00 บาท</h3></div>' +
      '</div>' +

      '<div class="row"><button class="btn btn-primary" id="rec-save"><span data-lucide="save"></span> บันทึกและตัดสต็อก</button>' +
      (isEdit ? ' <button class="btn" id="rec-print"><span data-lucide="printer"></span> พิมพ์ใบเสร็จ (PDF)</button>' : '') + '</div>';
    U.refreshIcons();

    var formItems = items.map(function (it) {
      return {
        medicineId: it.medicineId, medicineName: it.medicineName, lot: it.lot || '',
        qty: Number(it.qty || 1), pricePerUnit: Number(it.pricePerUnit || 0), totalPrice: Number(it.totalPrice || 0)
      };
    });

    renderItemsTable();

    if (!isEdit) {
      var searchInput = view.querySelector('#rec-med-search');
      var suggestBox = view.querySelector('#rec-med-suggest');
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
            formItems.push({
              medicineId: m.id, medicineName: m.name, lot: '',
              qty: 1, pricePerUnit: 0, totalPrice: 0
            });
            suggestBox.innerHTML = '';
            searchInput.value = '';
            renderItemsTable();
          };
        });
      }, 200));
    }

    function renderItemsTable() {
      var box = view.querySelector('#rec-items-list');
      if (!formItems.length) { box.innerHTML = '<p class="muted">ยังไม่มีรายการยา — ค้นหายาด้านบนเพื่อเพิ่ม</p>'; return; }
      box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>#</th><th>รายการยา</th><th>จำนวน</th><th>ราคา/หน่วย (บาท)</th><th>รวมเงิน (บาท)</th>' + (isEdit ? '' : '<th></th>') + '</tr></thead><tbody>' +
        formItems.map(function (it, idx) {
          it.totalPrice = Number(it.qty || 0) * Number(it.pricePerUnit || 0);
          return '<tr><td>' + (idx + 1) + '</td><td><strong>' + U.escapeHtml(it.medicineName) + '</strong></td>' +
            '<td><input type="number" min="1" value="' + it.qty + '" data-field="qty" data-idx="' + idx + '" style="width:70px"' + (isEdit ? ' disabled' : '') + ' /></td>' +
            '<td><input type="number" min="0" step="0.5" value="' + it.pricePerUnit + '" data-field="pricePerUnit" data-idx="' + idx + '" style="width:90px"' + (isEdit ? ' disabled' : '') + ' /></td>' +
            '<td><strong>' + it.totalPrice.toFixed(2) + '</strong></td>' +
            (isEdit ? '' : '<td><button class="btn btn-sm btn-danger" data-rm="' + idx + '"><span data-lucide="x"></span></button></td>') + '</tr>';
        }).join('') + '</tbody></table></div>';
      U.refreshIcons();

      var grandTotal = formItems.reduce(function (sum, x) { return sum + (x.totalPrice || 0); }, 0);
      view.querySelector('#rec-grand-total').textContent = 'ยอดรวมทั้งสิ้น: ' + grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';

      if (!isEdit) {
        box.querySelectorAll('[data-field]').forEach(function (inp) {
          inp.onchange = function () {
            var idx = Number(inp.getAttribute('data-idx'));
            var field = inp.getAttribute('data-field');
            formItems[idx][field] = Number(inp.value);
            renderItemsTable();
          };
        });
        box.querySelectorAll('[data-rm]').forEach(function (b) {
          b.onclick = function () { formItems.splice(Number(b.getAttribute('data-rm')), 1); renderItemsTable(); };
        });
      }
    }

    view.querySelector('#rec-back').onclick = function () {
      API.call('listReceipts').then(function (r) { state.receipts = r; renderList(); });
    };
    if (view.querySelector('#rec-save')) {
      view.querySelector('#rec-save').onclick = function () { doSave(); };
    }
    if (isEdit && view.querySelector('#rec-print')) {
      view.querySelector('#rec-print').onclick = function () { printReceipt(existing.id); };
    }

    function doSave() {
      if (!formItems.length) { Toast.error('ต้องมีรายการยาอย่างน้อย 1 รายการ'); return; }
      var btn = view.querySelector('#rec-save'); btn.disabled = true;
      var grandTotal = formItems.reduce(function (sum, x) { return sum + (x.totalPrice || 0); }, 0);

      var payload = {
        receiptNumber: isEdit ? existing.receiptNumber : undefined,
        receiptDate: view.querySelector('#rec-date').value,
        privilege: view.querySelector('#rec-privilege').value,
        patientName: view.querySelector('#rec-patient').value.trim(),
        patientHn: view.querySelector('#rec-hn').value.trim(),
        dispenserName: view.querySelector('#rec-dispenser').value.trim(),
        note: view.querySelector('#rec-note').value.trim(),
        totalAmount: grandTotal,
        items: formItems
      };

      API.call('saveReceipt', { receipt: payload }).then(function (r) {
        Toast.success('ออกใบเสร็จ ' + (r.receiptNumber || '') + ' เรียบร้อย');
        return API.call('listReceipts');
      }).then(function (r) { state.receipts = r; renderList(); })
        .catch(function (e) { Toast.error(e.message); })
        .finally(function () { btn.disabled = false; });
    }
  }

  // ===== พิมพ์ใบเสร็จ PDF =====
  function printReceipt(id) {
    API.call('getReceipt', { id: id }).then(function (rec) {
      var settings = App.getSettingsCache() || {};
      var hospitalName = settings.hospitalName || 'โรงพยาบาลส่งเสริมสุขภาพประจำตำบล';

      if (!window.jspdf || !window.jspdf.jsPDF) { Toast.error('โหลดไลบรารี PDF ไม่สำเร็จ'); return; }
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

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

      var y = 15;
      doc.setFontSize(16);
      doc.text('ใบเสร็จรับเงิน / ใบจ่ายยา', 74, y, { align: 'center' }); y += 7;
      doc.setFontSize(12);
      doc.text(hospitalName, 74, y, { align: 'center' }); y += 8;

      doc.setFontSize(10);
      doc.text('เลขที่ใบเสร็จ: ' + rec.receiptNumber, 15, y);
      doc.text('วันที่: ' + U.thaiDate(rec.receiptDate), 100, y); y += 6;
      doc.text('ผู้ป่วย/ผู้รับยา: ' + (rec.patientName || '-'), 15, y);
      doc.text('สิทธิ: ' + (rec.privilege || 'ทั่วไป'), 100, y); y += 8;

      var tableRows = (rec.items || []).map(function (it, idx) {
        return [String(idx + 1), it.medicineName, String(it.qty), Number(it.pricePerUnit || 0).toFixed(2), Number(it.totalPrice || 0).toFixed(2)];
      });

      doc.autoTable({
        head: [['#', 'รายการยา', 'จำนวน', 'ราคา/หน่วย', 'ราคารวม']],
        body: tableRows,
        startY: y,
        styles: { font: font, fontSize: 9, cellPadding: 1.5 },
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 22 }
        },
        margin: { left: 10, right: 10 }
      });

      y = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(11);
      doc.text('ยอดรวมทั้งสิ้น: ' + Number(rec.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท', 135, y, { align: 'right' }); y += 14;

      doc.setFontSize(9);
      doc.text('ลงชื่อ..........................................................ผู้จ่ายยา', 80, y); y += 5;
      if (rec.dispenserName) doc.text('( ' + rec.dispenserName + ' )', 95, y);

      doc.save('ใบเสร็จ_' + rec.receiptNumber + '.pdf');
      Toast.success('สร้าง PDF ใบเสร็จเรียบร้อย');
    }).catch(function (e) { Toast.error(e.message); });
  }
};
