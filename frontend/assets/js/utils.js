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

  // แปลงวันที่ที่มีปีตั้งแต่ 2400 (พ.ศ.) ให้กลับเป็น ค.ศ. สำหรับการคำนวณที่แม่นยำ
  function parseADDate(isoOrDate) {
    if (!isoOrDate) return null;
    var d = (isoOrDate instanceof Date) ? new Date(isoOrDate.getTime()) : new Date(isoOrDate);
    if (isNaN(d.getTime())) return null;
    var y = d.getFullYear();
    if (y >= 2400) {
      d.setFullYear(y - 543);
    }
    return d;
  }

  // คำนวณวันคงเหลือ (อ้างอิงเป็น ค.ศ. เพื่อไม่ให้ผิดพลาดเป็นหลักแสนวันในกรณีปีที่บันทึกเป็น พ.ศ.)
  function calcDaysLeft(isoOrDate, refDate) {
    if (!isoOrDate) return 999;
    var exp = parseADDate(isoOrDate);
    if (!exp) return 999;
    var now = refDate || new Date();
    var expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
    var nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.ceil((expDay - nowDay) / (1000 * 60 * 60 * 24));
  }

  // สร้างตัวเลือกวันที่แบบ ปี พ.ศ. (วัน, เดือน, ปี พ.ศ.)
  function createThaiDatePicker(idPrefix, defaultIso) {
    var TH_MONTH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    var curYearBE = new Date().getFullYear() + 543;
    var selDay = '', selMonth = '', selYear = '';
    
    if (defaultIso && String(defaultIso).trim()) {
      var d = parseADDate(defaultIso);
      if (d && !isNaN(d.getTime())) {
        selDay = pad(d.getDate());
        selMonth = pad(d.getMonth() + 1);
        selYear = String(d.getFullYear() + 543);
      }
    }
    
    var daysHtml = '<option value="">- วัน -</option>';
    for (var i = 1; i <= 31; i++) {
      var val = pad(i);
      daysHtml += '<option value="' + val + '"' + (selDay === val ? ' selected' : '') + '>' + i + '</option>';
    }
    
    var monthsHtml = '<option value="">- เดือน -</option>';
    for (var m = 0; m < 12; m++) {
      var mVal = pad(m + 1);
      monthsHtml += '<option value="' + mVal + '"' + (selMonth === mVal ? ' selected' : '') + '>' + TH_MONTH_FULL[m] + '</option>';
    }
    
    var yearsHtml = '<option value="">- ปี พ.ศ. -</option>';
    for (var y = curYearBE - 5; y <= curYearBE + 20; y++) {
      var yStr = String(y);
      yearsHtml += '<option value="' + yStr + '"' + (selYear === yStr ? ' selected' : '') + '>' + y + ' (' + (y - 543) + ')</option>';
    }
    
    return '<div style="display:flex;gap:4px;width:100%">' +
      '<select id="' + idPrefix + '-day" style="width:28%;padding:8px 4px;">' + daysHtml + '</select>' +
      '<select id="' + idPrefix + '-month" style="width:40%;padding:8px 4px;">' + monthsHtml + '</select>' +
      '<select id="' + idPrefix + '-year" style="width:32%;padding:8px 4px;">' + yearsHtml + '</select>' +
      '</div>';
  }

  // อ่านค่าจาก Thai Date Picker และแปลงกลับเป็น ISO string (YYYY-MM-DD ปี ค.ศ. สำหรับฐานข้อมูล)
  function getThaiDatePickerValue(container, idPrefix) {
    var dom = container || document;
    var dEl = dom.querySelector('#' + idPrefix + '-day');
    var mEl = dom.querySelector('#' + idPrefix + '-month');
    var yEl = dom.querySelector('#' + idPrefix + '-year');
    if (!dEl || !mEl || !yEl) return '';
    var d = dEl.value;
    var m = mEl.value;
    var y = parseInt(yEl.value, 10);
    if (!d || !m || !y || isNaN(y)) return '';
    var adYear = y >= 2400 ? y - 543 : y;
    return adYear + '-' + m + '-' + d;
  }

  return {
    thaiDate: thaiDate, thaiDateTime: thaiDateTime, todayISO: todayISO,
    daysLeftText: daysLeftText, BUCKET_META: BUCKET_META,
    escapeHtml: escapeHtml, debounce: debounce, el: el, refreshIcons: refreshIcons,
    fileToDataUrl: fileToDataUrl, parseADDate: parseADDate, calcDaysLeft: calcDaysLeft,
    createThaiDatePicker: createThaiDatePicker, getThaiDatePickerValue: getThaiDatePickerValue
  };
})();
