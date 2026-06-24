/**
 * ตั้งค่าระบบ — แก้ APPS_SCRIPT_URL ให้เป็น Web App URL ของคุณหลัง deploy
 * ตัวอย่าง: https://script.google.com/macros/s/AKfycbxxxxxxxx/exec
 */
window.APP_CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw-NLsd_Mlve3LeEtsspxFydJIl6cKT2pBkxqCG3N8Tulg20WTQlo9dYirGzqTFmGDM/exec',

  // ช่วงเตือนเริ่มต้น (วัน) — ค่าจริงจะถูกแทนที่ด้วยค่าจาก Settings ในเซิร์ฟเวอร์
  DEFAULT_THRESHOLDS: { red: 35, orange: 60, yellow: 120 }
};
