/**
 * API Wrapper — รองรับทั้ง Supabase (< 100ms) และ Google Apps Script
 */
window.API = (function () {
  function url() {
    var u = window.APP_CONFIG && window.APP_CONFIG.APPS_SCRIPT_URL;
    var provider = window.APP_CONFIG && window.APP_CONFIG.DATA_PROVIDER;
    // ถ้าใช้ Supabase เป็นหลัก ไม่จำเป็นต้องบังคับตั้งค่า APPS_SCRIPT_URL
    if (provider === 'supabase') {
      return u || '';
    }
    if (!u || u.indexOf('PASTE_YOUR') === 0) {
      throw new Error('ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ใน assets/js/config.js');
    }
    return u;
  }

  function call(action, params) {
    params = params || {};

    var provider = window.APP_CONFIG && window.APP_CONFIG.DATA_PROVIDER;
    var hasSb = window.SupabaseAdapter && window.SupabaseAdapter.isConfigured();

    if (provider === 'supabase' && hasSb) {
      return callSupabase(action, params);
    }

    return callAppsScript(action, params);
  }

  function callSupabase(action, params) {
    var sb = window.SupabaseAdapter;
    switch (action) {
      case 'login': return sb.login(params.username, params.password);
      case 'listUsers': return sb.listUsers();
      case 'saveUser': return sb.saveUser(params);
      case 'deleteUser': return sb.deleteUser(params);
      case 'resetPassword': return sb.resetPassword(params);
      case 'changeMyPassword': return sb.changeMyPassword(params);
      case 'getSettings': return sb.getSettings();
      case 'saveSettings': return sb.saveSettings(params.settings);
      case 'getDashboard': return sb.getDashboard(params);
      case 'search': return sb.search(params);
      case 'listLocations': return sb.listLocations();
      case 'saveLocation': return sb.saveLocation(params.location);
      case 'listMedicines': return sb.listMedicines();
      case 'saveMedicine': return sb.saveMedicine(params.medicine);
      case 'listStockByLocation': return sb.listStockByLocation(params);
      case 'exportRows': return sb.exportRows(params.kind);
      case 'receive':
      case 'receiveStock': return sb.receiveStock(params);
      case 'dispense': return sb.dispense(params);
      case 'adjustCount': return sb.adjustCount(params);
      case 'transfer':
      case 'transferStock': return sb.transferStock(params);
      case 'listMovements': return sb.listMovements();
      case 'listRequisitions': return sb.listRequisitions();
      case 'getRequisition': return sb.getRequisition(params.id);
      case 'saveRequisition': return sb.saveRequisition(params);
      case 'deleteRequisition': return sb.deleteRequisition(params.id);
      case 'listReceipts': return sb.listReceipts();
      case 'getReceipt': return sb.getReceipt(params.id);
      case 'saveReceipt': return sb.saveReceipt(params.receipt);
      case 'deleteReceipt': return sb.deleteReceipt(params.id);
      case 'importGoogleSheetSeed': return sb.importGoogleSheetSeed();
      case 'testNotify': return Promise.resolve(true);
      default:
        var scriptUrl = url();
        if (!scriptUrl) return Promise.resolve({});
        return callAppsScript(action, params);
    }
  }

  function callAppsScript(action, params) {
    var scriptUrl = url();
    if (!scriptUrl) return Promise.reject(new Error('ไม่ได้ตั้งค่า APPS_SCRIPT_URL'));

    var body = Object.assign({ action: action }, params);
    var token = window.Auth && window.Auth.getToken && window.Auth.getToken();
    if (token) body.token = token;

    return Promise.resolve().then(function () {
      return fetch(scriptUrl, {
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
        if (json.error === 'UNAUTHORIZED' && window.APP_CONFIG.DATA_PROVIDER === 'apps_script') {
          window.Auth && window.Auth.onUnauthorized && window.Auth.onUnauthorized();
        }
        throw err;
      }
      return json.data;
    });
  }

  return { call: call };
})();
