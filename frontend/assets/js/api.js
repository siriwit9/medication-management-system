/**
 * ตัวเรียก Apps Script Web App
 * ใช้ POST แบบ text/plain เพื่อเลี่ยง CORS preflight, แนบ token ใน body
 */
window.API = (function () {
  function url() {
    var u = window.APP_CONFIG && window.APP_CONFIG.APPS_SCRIPT_URL;
    if (!u || u.indexOf('PASTE_YOUR') === 0) {
      throw new Error('ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ใน assets/js/config.js');
    }
    return u;
  }

  function call(action, params) {
    params = params || {};
    var body = Object.assign({ action: action }, params);
    var token = window.Auth && window.Auth.getToken && window.Auth.getToken();
    if (token) body.token = token;

    return Promise.resolve().then(function () {
      return fetch(url(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        redirect: 'follow'
      });
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      if (!json.ok) {
        var err = new Error(json.error || 'เกิดข้อผิดพลาด');
        err.code = json.error;
        if (json.error === 'UNAUTHORIZED') {
          window.Auth && window.Auth.onUnauthorized && window.Auth.onUnauthorized();
        }
        throw err;
      }
      return json.data;
    });
  }

  return { call: call };
})();
