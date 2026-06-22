/** แลก/ย้ายยา: ค้นหาจาก ชื่อยา / สถานที่ / Lot / บาร์โค้ด แล้วย้ายไปจุดอื่น */
window.Views = window.Views || {};
Views.transfer = function (view) {
  var canManage = Auth.hasRole('pharmacist');
  return API.call('listLocations').then(function (locs) {
    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">แลก / ย้ายยา</h1></div>' +
      '<div class="card mb-16"><div class="field"><label>ค้นหายาที่ต้องการย้าย</label>' +
      '<div class="row"><input id="tr-search" placeholder="ชื่อยา / สถานที่ / Lot / บาร์โค้ด" style="flex:1;min-width:220px" autofocus />' +
      '<button class="btn" id="tr-cam"><span data-lucide="camera"></span> สแกน</button></div></div></div>' +
      '<div id="tr-results"></div>';

    var input = view.querySelector('#tr-search');
    var results = view.querySelector('#tr-results');

    function doSearch(q) {
      q = (q || '').trim();
      if (!q) { results.innerHTML = '<div class="card empty-state">พิมพ์เพื่อค้นหายาที่ต้องการย้าย</div>'; return; }
      API.call('search', { query: q }).then(function (rows) {
        if (!rows.length) { results.innerHTML = '<div class="card empty-state">ไม่พบรายการ</div>'; return; }
        results.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ชื่อยา</th><th>สถานที่</th><th>Lot</th><th>วันหมดอายุ</th><th>คงเหลือ</th>' +
          (canManage ? '<th>จัดการ</th>' : '') + '</tr></thead><tbody>' +
          rows.map(function (r, i) {
            return '<tr><td>' + U.escapeHtml(r.medicineName) + '</td><td>' + U.escapeHtml(r.locationName) + '</td>' +
              '<td>' + U.escapeHtml(r.lot || '-') + '</td><td>' + U.thaiDate(r.expiryDate) + '</td><td>' + r.qty + ' ' + U.escapeHtml(r.unit || '') + '</td>' +
              (canManage ? '<td><button class="btn btn-sm" data-i="' + i + '">ย้าย</button></td>' : '') + '</tr>';
          }).join('') + '</tbody></table></div>';
        results.querySelectorAll('[data-i]').forEach(function (btn) {
          btn.onclick = function () {
            openTransfer(rows[Number(btn.getAttribute('data-i'))], locs, function () { doSearch(input.value); });
          };
        });
      });
    }

    input.addEventListener('input', U.debounce(function () { doSearch(input.value); }, 300));
    Scanner.attachHidInput(input, function (code) { input.value = code; doSearch(code); });
    view.querySelector('#tr-cam').onclick = function () { Scanner.openCamera(function (code) { input.value = code; doSearch(code); }); };

    doSearch('');
    U.refreshIcons();
  });
};
