/** ส่งออก Excel (.xlsx) และ PDF — รองรับภาษาไทย */
window.Exporter = (function () {
  // aoa = array of arrays (แถวแรกคือหัวตาราง)
  function toXlsx(aoa, filename, sheetName) {
    if (typeof XLSX === 'undefined') { Toast.error('โหลดไลบรารี Excel ไม่สำเร็จ'); return; }
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    // ความกว้างคอลัมน์โดยประมาณ
    ws['!cols'] = (aoa[0] || []).map(function () { return { wch: 18 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Sheet1').slice(0, 31));
    XLSX.writeFile(wb, filename + '.xlsx');
  }

  // PDF: ใช้ jsPDF + autotable; ฟอนต์ default ไม่รองรับไทยเต็มที่ จึงฝังฟอนต์ Sarabun ถ้ามี
  function toPdf(opts) {
    if (!window.jspdf || !window.jspdf.jsPDF) { Toast.error('โหลดไลบรารี PDF ไม่สำเร็จ'); return; }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: opts.landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

    var useThai = false;
    if (window.THAI_FONT_BASE64) {
      try {
        doc.addFileToVFS('Sarabun.ttf', window.THAI_FONT_BASE64);
        doc.addFont('Sarabun.ttf', 'Sarabun', 'normal');
        doc.setFont('Sarabun');
        useThai = true;
      } catch (e) {}
    }

    doc.setFontSize(16);
    doc.text(opts.title || 'รายงาน', 14, 16);
    doc.setFontSize(10);
    if (opts.subtitle) doc.text(opts.subtitle, 14, 23);

    doc.autoTable({
      head: [opts.headers],
      body: opts.rows,
      startY: 28,
      styles: { font: useThai ? 'Sarabun' : 'helvetica', fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save((opts.filename || 'report') + '.pdf');

    if (!useThai) {
      Toast.show('หมายเหตุ: PDF อาจแสดงภาษาไทยไม่สมบูรณ์ หากต้องการให้คมชัด ให้เพิ่มฟอนต์ไทย (ดู README)', '', 5000);
    }
  }

  return { toXlsx: toXlsx, toPdf: toPdf };
})();
