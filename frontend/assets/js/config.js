/**
 * ตั้งค่าระบบคลังยา
 */
window.APP_CONFIG = {
  // เลือก Backend Principal ('supabase' หรือ 'apps_script')
  DATA_PROVIDER: 'supabase',

  // ตั้งค่า Supabase (เปิดใช้งานความเร็วสูง < 100ms)
  SUPABASE_URL: 'https://okcctrkxsuhgjvitwaus.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Jbk3rrBV6uUi0zIX2T03rw_SxboQ6TN',

  // Google Apps Script Web App URL (สำรอง / ใช้สำหรับแจ้งเตือน Telegram)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw-NLsd_Mlve3LeEtsspxFydJIl6cKT2pBkxqCG3N8Tulg20WTQlo9dYirGzqTFmGDM/exec',

  // ช่วงเตือนเริ่มต้น (วัน)
  DEFAULT_THRESHOLDS: { red: 35, orange: 60, yellow: 120 }
};
