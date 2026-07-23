/**
 * ระบบนำเข้าข้อมูลและเปรียบเทียบยอดยาจาก JHCIS (JHCIS Import & Reconciliation)
 */
window.Views = window.Views || {};
Views.jhcisImport = function (view) {
  var state = { existingMeds: [], existingStock: [], diffResults: [] };

  return Promise.all([
    API.call('listMedicines').catch(function () { return []; }),
    API.call('exportRows', { kind: 'stock' }).catch(function () { return { rows: [] }; })
  ]).then(function (res) {
    state.existingMeds = res[0];
    state.existingStock = res[1].rows || [];
    renderUI();
  });

  function renderUI() {
    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">นำเข้าและเปรียบเทียบข้อมูล JHCIS</h1></div>' +
      '<div class="card mb-16">' +
      '<h3>1. อัปโหลดไฟล์ Excel / CSV จาก JHCIS</h3>' +
      '<p class="muted">ส่งออกไฟล์ตาราง <code>cdrug</code> หรือ <code>cdrugstock</code> จาก JHCIS มาเป็น .xlsx หรือ .csv แล้วนำมาอัปโหลดที่นี่</p>' +
      '<div style="border: 2px dashed #cbd5e1; padding: 24px; text-align: center; border-radius: 8px; background: #f8fafc; margin-top: 12px">' +
      '<input type="file" id="jhcis-file" accept=".xlsx,.xls,.csv" style="display:none" />' +
      '<button class="btn btn-primary" id="btn-browse"><span data-lucide="upload"></span> เลือกไฟล์ JHCIS (.xlsx, .csv)</button>' +
      '<div id="file-info" style="margin-top: 8px; font-weight: 500" class="muted">ยังไม่ได้เลือกไฟล์</div>' +
      '</div></div>' +

      '<div id="reconcile-section" class="card hidden mb-16">' +
      '<div class="page-head"><h3 style="margin:0">2. ผลการเปรียบเทียบยอดยา (Reconciliation Audit)</h3>' +
      '<button class="btn btn-primary" id="btn-sync-all"><span data-lucide="check-circle"></span> อัปเดตข้อมูลเข้าคลังยา</button></div>' +
      '<div id="audit-summary" class="grid grid-3 mb-16" style="margin-top:12px"></div>' +
      '<div id="audit-table-wrap"></div>' +
      '</div>';
    U.refreshIcons();

    var fileInput = view.querySelector('#jhcis-file');
    var browseBtn = view.querySelector('#btn-browse');
    var fileInfo = view.querySelector('#file-info');

    browseBtn.onclick = function () { fileInput.click(); };
    fileInput.onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      fileInfo.textContent = 'เลือกไฟล์: ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      parseJhcisFile(file);
    };

    view.querySelector('#btn-sync-all').onclick = function () { doSync(); };
  }

  function parseJhcisFile(file) {
    if (!window.XLSX) { Toast.error('ไม่พบไลบรารี XLSX'); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var firstSheet = workbook.SheetNames[0];
        var jsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        if (!jsonRows || !jsonRows.length) { Toast.error('ไม่พบข้อมูลในไฟล์'); return; }
        analyzeJhcisData(jsonRows);
      } catch (err) {
        Toast.error('อ่านไฟล์ไม่สำเร็จ: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function analyzeJhcisData(rows) {
    // Map คอลัมน์จาก JHCIS (cdrug หรือ excel ภาษาไทย/อังกฤษ)
    // คอลัมน์ที่พบบ่อยใน JHCIS: drugcode, drugname, unit, qty, packsize
    state.diffResults = rows.map(function (row) {
      var code = String(row.drugcode || row['รหัสยา'] || row.barcode || row['บาร์โค้ด'] || '').trim();
      var name = String(row.drugname || row['ชื่อยา'] || row.name || '').trim();
      var unit = String(row.unit || row['หน่วยนับ'] || '').trim();
      var jhcisQty = Number(row.qty || row['จำนวนคงเหลือ'] || row.amount || 0);

      // ค้นหายาเดิมในระบบ
      var matchedMed = state.existingMeds.filter(function (m) {
        return (code && (m.jhcisDrugCode === code || m.barcode === code)) || (name && m.name.toLowerCase() === name.toLowerCase());
      })[0];

      var webAppQty = 0;
      if (matchedMed) {
        state.existingStock.forEach(function (s) {
          if (s[0] === matchedMed.name) webAppQty += Number(s[5] || 0);
        });
      }

      var status = 'new';
      if (matchedMed) {
        status = (webAppQty === jhcisQty) ? 'match' : 'diff';
      }

      return {
        code: code, name: name || 'ไม่ระบุชื่อ', unit: unit,
        jhcisQty: jhcisQty, webAppQty: webAppQty, status: status, matchedMed: matchedMed
      };
    });

    renderAuditTable();
  }

  function renderAuditTable() {
    var section = view.querySelector('#reconcile-section');
    section.classList.remove('hidden');

    var total = state.diffResults.length;
    var matchCount = state.diffResults.filter(function (x) { return x.status === 'match'; }).length;
    var diffCount = state.diffResults.filter(function (x) { return x.status === 'diff'; }).length;
    var newCount = state.diffResults.filter(function (x) { return x.status === 'new'; }).length;

    view.querySelector('#audit-summary').innerHTML =
      '<div class="card" style="border-left: 4px solid #16a34a"><h4>ตรงกัน</h4><h2>' + matchCount + ' รายการ</h2></div>' +
      '<div class="card" style="border-left: 4px solid #d97706"><h4>ยอดไม่ตรง</h4><h2>' + diffCount + ' รายการ</h2></div>' +
      '<div class="card" style="border-left: 4px solid #2563eb"><h4>ยาใหม่จาก JHCIS</h4><h2>' + newCount + ' รายการ</h2></div>';

    var statusTag = {
      match: '<span class="pill-tag tag-green">ตรงกัน</span>',
      diff: '<span class="pill-tag tag-yellow">ยอดไม่ตรง</span>',
      new: '<span class="pill-tag tag-blue">ยาใหม่</span>'
    };

    view.querySelector('#audit-table-wrap').innerHTML =
      '<div class="table-wrap"><table><thead><tr><th>รหัสยา (JHCIS)</th><th>รายการยา</th><th>หน่วย</th><th>คงเหลือ (JHCIS)</th><th>คงเหลือ (WebApp)</th><th>สถานะ</th></tr></thead><tbody>' +
      state.diffResults.map(function (item) {
        return '<tr><td>' + U.escapeHtml(item.code || '-') + '</td>' +
          '<td><strong>' + U.escapeHtml(item.name) + '</strong></td>' +
          '<td>' + U.escapeHtml(item.unit || '-') + '</td>' +
          '<td>' + item.jhcisQty + '</td>' +
          '<td>' + item.webAppQty + '</td>' +
          '<td>' + statusTag[item.status] + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function doSync() {
    if (!state.diffResults.length) return;
    Modal.confirm({
      title: 'ยืนยันซิงค์ข้อมูล JHCIS',
      message: 'ระบบจะทำการเพิ่มรายการยาใหม่ และปรับปรุงยอดคลังยาให้ตรงตาม JHCIS คุณต้องการดำเนินการต่อหรือไม่?'
    }).then(function (ok) {
      if (!ok) return;
      var promises = state.diffResults.map(function (item) {
        // เพิ่มยาใหม่ถ้ายังไม่มี
        var saveMedP = item.matchedMed ? Promise.resolve(item.matchedMed) : API.call('saveMedicine', {
          medicine: { name: item.name, barcode: item.code, unit: item.unit, jhcisDrugCode: item.code }
        });

        return saveMedP.then(function (med) {
          // ปรับยอดสต็อกให้ตรงกับ JHCIS
          var diff = item.jhcisQty - item.webAppQty;
          if (diff !== 0) {
            return API.call('receiveStock', {
              medicineId: med.id,
              locationId: null,
              qty: diff,
              reason: 'Sync ปรับยอดจาก JHCIS'
            });
          }
        });
      });

      Promise.all(promises).then(function () {
        Toast.success('ซิงค์ข้อมูลจาก JHCIS สำเร็จเรียบร้อย');
        location.hash = '#/catalog';
      }).catch(function (e) { Toast.error(e.message); });
    });
  }
};
