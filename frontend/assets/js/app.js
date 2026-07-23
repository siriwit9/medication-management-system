/** จุดเริ่มต้นแอป: ตัดสินใจแสดง login หรือ shell, ผูกเหตุการณ์ topbar/sidebar */
window.App = (function () {
  var settingsCache = null;

  function render() {
    var loginScreen = document.getElementById('login-screen');
    var shell = document.getElementById('app-shell');

    if (!Auth.isLoggedIn()) {
      shell.classList.add('hidden');
      loginScreen.classList.remove('hidden');
      U.refreshIcons();
      return;
    }

    loginScreen.classList.add('hidden');
    shell.classList.remove('hidden');

    // อัปเดต badge ผู้ใช้
    var user = Auth.getUser() || {};
    var username = user.username || 'admin';
    var roleName = user.role || 'admin';
    document.getElementById('user-badge').textContent =
      username + ' · ' + (Auth.ROLE_LABEL[roleName] || roleName);

    // ซ่อนเมนูตามสิทธิ์
    document.querySelectorAll('[data-min-role]').forEach(function (a) {
      var need = a.getAttribute('data-min-role');
      a.classList.toggle('hidden', !Auth.hasRole(need));
    });

    if (!location.hash || location.hash === '#/login') {
      location.hash = '#/dashboard';
    }
    Router.navigate();
    loadBranding();
  }

  function loadBranding() {
    API.call('getSettings').then(function (s) {
      settingsCache = s;
      if (s && s.hospitalName) document.getElementById('brand-name').textContent = s.hospitalName;
    }).catch(function () {});
  }

  function getSettingsCache() { return settingsCache; }
  function setSettingsCache(s) { settingsCache = s; }

  function bindLogin() {
    var form = document.getElementById('login-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errBox = document.getElementById('login-error');
      errBox.classList.add('hidden');
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'กำลังเข้าสู่ระบบ...';
      var u = document.getElementById('login-username').value.trim();
      var p = document.getElementById('login-password').value;
      Auth.login(u, p).then(function () {
        document.getElementById('login-password').value = '';
        render();
        location.hash = '#/dashboard';
      }).catch(function (err) {
        errBox.textContent = err.message || 'เข้าสู่ระบบไม่สำเร็จ';
        errBox.classList.remove('hidden');
      }).finally(function () {
        btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
      });
    });
  }

  function bindShell() {
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    document.getElementById('menu-toggle').addEventListener('click', function () {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    });
    backdrop.addEventListener('click', function () {
      sidebar.classList.remove('open'); backdrop.classList.remove('show');
    });
    document.getElementById('logout-btn').addEventListener('click', function () { Auth.logout(); });
  }

  function init() {
    bindLogin();
    bindShell();
    render();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  return { render: render, getSettingsCache: getSettingsCache, setSettingsCache: setSettingsCache };
})();

window.Views = window.Views || {};
