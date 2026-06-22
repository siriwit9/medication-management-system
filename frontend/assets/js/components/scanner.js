/**
 * สแกนบาร์โค้ด: เครื่องยิง HID (พิมพ์แล้วจบด้วย Enter) + กล้องมือถือ (html5-qrcode)
 */
window.Scanner = (function () {
  // ผูกช่อง input ให้รับค่าจากเครื่องยิง HID: เมื่อกด Enter จะเรียก onScan(code)
  function attachHidInput(inputEl, onScan) {
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var code = inputEl.value.trim();
        if (code) { onScan(code); }
      }
    });
  }

  // เปิดกล้องในกรอบ modal; เรียก onScan เมื่ออ่านได้ แล้วปิดอัตโนมัติ
  function openCamera(onScan) {
    if (typeof Html5Qrcode === 'undefined') {
      Toast.error('โหลดไลบรารีกล้องไม่สำเร็จ');
      return;
    }
    var box = U.el('<div><div id="cam-reader" class="scanner-box"></div><p class="muted" style="margin-top:10px">เล็งบาร์โค้ด/QR ให้อยู่ในกรอบ</p></div>');
    var m = Modal.open({ title: 'สแกนด้วยกล้อง', body: box });
    var reader = new Html5Qrcode('cam-reader');
    var stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      reader.stop().then(function () { reader.clear(); }).catch(function () {});
    }

    reader.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      function (decodedText) {
        stop();
        m.close();
        onScan(decodedText.trim());
      },
      function () {}
    ).catch(function (err) {
      Toast.error('เปิดกล้องไม่ได้: ต้องใช้ผ่าน https และอนุญาตสิทธิ์กล้อง');
      m.close();
    });

    m.backdrop.addEventListener('click', function (e) {
      if (e.target === m.backdrop || e.target.closest('[data-close]')) stop();
    });
  }

  return { attachHidInput: attachHidInput, openCamera: openCamera };
})();
