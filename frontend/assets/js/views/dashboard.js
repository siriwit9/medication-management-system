/** หน้าหลัก: สรุปใกล้หมดอายุ 4 ช่วง, ค้นหาทั้งระบบ, สต็อกต่ำ, แยกสถานที่ */
window.Views = window.Views || {};
Views.dashboard = function (view, params) {
  var locationId = params.location || '';
  return API.call('getDashboard', { locationId: locationId }).then(function (d) {
    var t = d.thresholds;
    var labels = {
      red: 'ภายใน ' + t.red + ' วัน',
      orange: 'ภายใน ' + t.orange + ' วัน',
      yellow: 'ภายใน ' + t.yellow + ' วัน',
      green: 'มากกว่า ' + t.yellow + ' วัน'
    };
    var subs = { red: 'เร่งด่วน (รวมหมดอายุแล้ว)', orange: '', yellow: '', green: 'ปลอดภัย' };

    view.innerHTML =
      '<div class="page-head"><h1 class="page-title">หน้าหลัก</h1></div>' +
      '<div class="field"><input id="dash-search" type="search" placeholder="ค้นหาทั้งระบบ: ชื่อยา / สถานที่ / Lot / บาร์โค้ด" /></div>' +
      '<div id="search-results"></div>' +
      '<div class="grid grid-4 mb-16">' +
      ['red', 'orange', 'yellow', 'green'].map(function (k) {
        return '<div class="card card-clickable bucket-card bucket-' + k + '" data-bucket="' + k + '">' +
          '<div class="num">' + d.buckets[k] + '</div>' +
          '<div class="lbl">' + labels[k] + (subs[k] ? ' · ' + subs[k] : '') + '</div></div>';
      }).join('') +
      '</div>' +
      (d.lowStock.length ?
        '<div class="card mb-16" style="border-left:4px solid var(--orange)">' +
        '<strong>⚠️ สต็อกต่ำกว่าขั้นต่ำ (' + d.lowStock.length + ')</strong>' +
        '<div class="mt-16">' + d.lowStock.map(function (l) {
          return '<div class="list-item"><div class="grow"><div class="title">' + U.escapeHtml(l.medicineName) + '</div>' +
            '<div class="sub">มี ' + l.have + ' / ขั้นต่ำ ' + l.minStock + '</div></div></div>';
        }).join('') + '</div></div>' : '') +
      '<div class="page-head"><h2 class="page-title" style="font-size:18px">สรุปแยกตามสถานที่</h2></div>' +
      '<div class="grid grid-2 mb-16" id="per-location"></div>' +
      '<div class="page-head"><h2 class="page-title" style="font-size:18px" id="list-title">รายการใกล้หมดอายุ</h2>' +
      '<button class="btn btn-sm" id="clear-filter">ดูทั้งหมด</button></div>' +
      '<div id="items-table"></div>';

    // per location
    var pl = view.querySelector('#per-location');
    pl.innerHTML = d.perLocation.map(function (l) {
      return '<div class="card card-clickable loc-card" data-loc="' + l.id + '">' +
        '<div class="loc-icon" style="background:' + U.escapeHtml(l.color || '#2563eb') + '"><span data-lucide="' + U.escapeHtml(l.icon || 'map-pin') + '"></span></div>' +
        '<div class="loc-meta"><div class="name">' + U.escapeHtml(l.name) + '</div>' +
        '<div class="sub muted">' + l.lines + ' รายการ · รวม ' + l.totalQty + '</div></div>' +
        '<div>' + (l.buckets.red ? '<span class="pill-tag tag-red">' + l.buckets.red + '</span> ' : '') +
        (l.buckets.orange ? '<span class="pill-tag tag-orange">' + l.buckets.orange + '</span>' : '') + '</div></div>';
    }).join('') || '<div class="muted">ยังไม่มีสถานที่</div>';
    pl.querySelectorAll('[data-loc]').forEach(function (c) {
      c.onclick = function () { location.hash = '#/locations-stock?location=' + c.getAttribute('data-loc'); };
    });

    var activeBucket = null;
    function renderTable() {
      var items = d.items.filter(function (it) { return !activeBucket || it.bucket === activeBucket; });
      view.querySelector('#items-table').innerHTML = renderItemsTable(items);
      view.querySelector('#list-title').textContent = activeBucket ? 'รายการ: ' + labels[activeBucket] : 'รายการใกล้หมดอายุทั้งหมด';
      U.refreshIcons();
    }

    view.querySelectorAll('[data-bucket]').forEach(function (c) {
      c.onclick = function () {
        activeBucket = c.getAttribute('data-bucket');
        view.querySelectorAll('[data-bucket]').forEach(function (x) { x.classList.toggle('dim', x !== c); });
        renderTable();
      };
    });
    view.querySelector('#clear-filter').onclick = function () {
      activeBucket = null;
      view.querySelectorAll('[data-bucket]').forEach(function (x) { x.classList.remove('dim'); });
      renderTable();
    };

    // ค้นหา
    var searchBox = view.querySelector('#dash-search');
    var resultsEl = view.querySelector('#search-results');
    searchBox.addEventListener('input', U.debounce(function () {
      var q = searchBox.value.trim();
      if (!q) { resultsEl.innerHTML = ''; return; }
      API.call('search', { query: q }).then(function (rows) {
        resultsEl.innerHTML = '<div class="card mb-16"><strong>ผลการค้นหา (' + rows.length + ')</strong>' +
          (rows.length ? '<div class="table-wrap mt-16">' + renderSearchRows(rows) + '</div>' : '<p class="muted">ไม่พบรายการ</p>') + '</div>';
        U.refreshIcons();
      });
    }, 350));

    renderTable();
    U.refreshIcons();
  });
};

function renderItemsTable(items) {
  if (!items.length) return '<div class="card empty-state">ไม่มีรายการ</div>';
  var rows = items.map(function (it) {
    var meta = U.BUCKET_META[it.bucket];
    return '<tr><td>' + U.escapeHtml(it.medicineName) + '</td>' +
      '<td>' + U.escapeHtml(it.locationName) + '</td>' +
      '<td>' + U.escapeHtml(it.lot || '-') + '</td>' +
      '<td>' + U.thaiDate(it.expiryDate) + '</td>' +
      '<td><span class="pill-tag tag-' + it.bucket + '">' + U.daysLeftText(it.daysLeft) + '</span></td>' +
      '<td>' + it.qty + ' ' + U.escapeHtml(it.unit || '') + '</td></tr>';
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th>ชื่อยา</th><th>สถานที่</th><th>Lot</th><th>วันหมดอายุ</th><th>สถานะ</th><th>คงเหลือ</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function renderSearchRows(rows) {
  var body = rows.map(function (r) {
    return '<tr><td>' + U.escapeHtml(r.medicineName) + '</td><td>' + U.escapeHtml(r.locationName) + '</td>' +
      '<td>' + U.escapeHtml(r.lot || '-') + '</td><td>' + U.thaiDate(r.expiryDate) + '</td>' +
      '<td>' + U.daysLeftText(r.daysLeft) + '</td><td>' + r.qty + ' ' + U.escapeHtml(r.unit || '') + '</td></tr>';
  }).join('');
  return '<table><thead><tr><th>ชื่อยา</th><th>สถานที่</th><th>Lot</th><th>วันหมดอายุ</th><th>สถานะ</th><th>คงเหลือ</th></tr></thead><tbody>' + body + '</tbody></table>';
}
