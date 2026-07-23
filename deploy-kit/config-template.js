/**
 * Config Template — ระบบจัดการคลังยา รพ.สต.
 *
 * คำแนะนำ: คัดลอกไฟล์นี้ไปแทนที่ frontend/assets/js/config.js
 * แล้วแก้ไขค่าตามหมายเหตุด้านล่าง
 */
(function () {
  function getMeta(name) {
    var el = document.querySelector('meta[name="app-' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  window.APP_CONFIG = {
    // ไม่ต้องเปลี่ยน
    DATA_PROVIDER: getMeta('data-provider') || 'supabase',

    // === แก้ไขตรงนี้ ===
    // ได้จาก Supabase Dashboard > Settings > API > Project URL
    SUPABASE_URL: getMeta('supabase-url') || 'YOUR_SUPABASE_URL',

    // ได้จาก Supabase Dashboard > Settings > API > anon public key
    SUPABASE_ANON_KEY: getMeta('supabase-key') || 'YOUR_SUPABASE_ANON_KEY',

    // (ไม่บังคับ) Google Apps Script URL สำหรับแจ้งเตือน Telegram
    APPS_SCRIPT_URL: getMeta('gas-url') || '',

    // (ไม่บังคับ) รหัสสถานพยาบาล
    HOSPITAL_CODE: getMeta('hospital-code') || '',

    // ช่วงเตือนเริ่มต้น (วัน) — ปรับได้ภายหลังในหน้าตั้งค่า
    DEFAULT_THRESHOLDS: { red: 35, orange: 60, yellow: 120 }
  };
})();
