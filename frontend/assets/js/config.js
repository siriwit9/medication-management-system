/**
 * ตั้งค่าระบบคลังยา
 * รองรับการตั้งค่าผ่าน <meta> tags ใน HTML สำหรับ Multi-tenant deployment
 * หรือกำหนดค่าตรงในไฟล์นี้
 */
(function () {
  // อ่านค่าจาก <meta> tags (ใช้สำหรับ deploy-kit)
  function getMeta(name) {
    var el = document.querySelector('meta[name="app-' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  window.APP_CONFIG = {
    // เลือก Backend Principal ('supabase' หรือ 'apps_script')
    DATA_PROVIDER: getMeta('data-provider') || 'supabase',

    // ตั้งค่า Supabase (เปิดใช้งานความเร็วสูง < 100ms)
    SUPABASE_URL: getMeta('supabase-url') || 'https://okcctrkxsuhgjvitwaus.supabase.co',
    SUPABASE_ANON_KEY: getMeta('supabase-key') || 'sb_publishable_Jbk3rrBV6uUi0zIX2T03rw_SxboQ6TN',

    // Google Apps Script Web App URL (สำรอง / ใช้สำหรับแจ้งเตือน Telegram)
    APPS_SCRIPT_URL: getMeta('gas-url') || 'https://script.google.com/macros/s/AKfycbw-NLsd_Mlve3LeEtsspxFydJIl6cKT2pBkxqCG3N8Tulg20WTQlo9dYirGzqTFmGDM/exec',

    // รหัสสถานพยาบาล (สำหรับแยก Multi-tenant)
    HOSPITAL_CODE: getMeta('hospital-code') || '',

    // ช่วงเตือนเริ่มต้น (วัน)
    DEFAULT_THRESHOLDS: { red: 35, orange: 60, yellow: 120 }
  };
})();
