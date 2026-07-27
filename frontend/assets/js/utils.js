/** ฟังก์ชันช่วยทั่วไป: วันที่ พ.ศ., จัดรูปแบบ, สี bucket, DOM helper */
window.U = (function () {
  var TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // YYYY-MM-DD หรือ DD/MM/YYYY -> "12 ม.ค. 2569" (พ.ศ.)
  function thaiDate(isoOrDate) {
    if (!isoOrDate) return '-';
    if (typeof isoOrDate === 'string') {
      var str = isoOrDate.trim();
      if (str.indexOf('/') >= 0) {
        var parts = str.split('/');
        if (parts.length === 3) {
          var day = parseInt(parts[0], 10);
          var month = parseInt(parts[1], 10) - 1;
          var year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            if (year < 2400) year += 543;
            if (month >= 0 && month < 12) {
              return day + ' ' + TH_MONTHS[month] + ' ' + year;
            }
          }
        }
      }
    }
    var d = (isoOrDate instanceof Date) ? isoOrDate : new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    var y = d.getFullYear();
    if (y < 2400) y += 543;
    return d.getDate() + ' ' + TH_MONTHS[d.getMonth()] + ' ' + y;
  }

  // วันเวลาแบบเต็ม (พ.ศ.)
  function thaiDateTime(iso) {
    if (!iso) return '-';
    var d = (iso instanceof Date) ? iso : new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return thaiDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // วันที่วันนี้แบบ ISO (YYYY-MM-DD) ตามเวลาเครื่อง
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function daysLeftText(days) {
    if (days === null || days === undefined) return 'ไม่ระบุ';
    if (days < 0) return 'หมดอายุแล้ว ' + Math.abs(days) + ' วัน';
    if (days === 0) return 'หมดอายุวันนี้';
    return 'เหลือ ' + days + ' วัน';
  }

  var BUCKET_META = {
    red: { label: 'ภายใน 35 วัน', color: '#dc2626', cls: 'bucket-red' },
    orange: { label: 'ภายใน 60 วัน', color: '#ea580c', cls: 'bucket-orange' },
    yellow: { label: 'ภายใน 120 วัน', color: '#ca8a04', cls: 'bucket-yellow' },
    green: { label: 'มากกว่า 120 วัน', color: '#16a34a', cls: 'bucket-green' }
  };

  function escapeHtml(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms || 300);
    };
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function refreshIcons() {
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  return {
    thaiDate: thaiDate, thaiDateTime: thaiDateTime, todayISO: todayISO,
    daysLeftText: daysLeftText, BUCKET_META: BUCKET_META,
    escapeHtml: escapeHtml, debounce: debounce, el: el, refreshIcons: refreshIcons,
    fileToDataUrl: fileToDataUrl
  };
})();
