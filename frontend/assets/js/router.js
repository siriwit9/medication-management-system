/** Hash router + guard ตามบทบาท */
window.Router = (function () {
  // path -> { render: fn(viewEl, params), minRole }
  var routes = {
    'dashboard': { render: function (v, p) { return Views.dashboard(v, p); } },
    'receive': { render: function (v, p) { return Views.receive(v, p); } },
    'locations-stock': { render: function (v, p) { return Views.locationsStock(v, p); } },
    'transfer': { render: function (v, p) { return Views.transfer(v, p); } },
    'catalog': { render: function (v, p) { return Views.catalog(v, p); }, minRole: 'pharmacist' },
    'history': { render: function (v, p) { return Views.history(v, p); } },
    'settings': { render: function (v, p) { return Views.settings(v, p); } },
    'help': { render: function (v, p) { return Views.help(v, p); } }
  };

  function parseHash() {
    var h = (location.hash || '#/dashboard').replace(/^#\//, '');
    var parts = h.split('?');
    var path = parts[0] || 'dashboard';
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (kv) {
        var pair = kv.split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      });
    }
    return { path: path, params: params };
  }

  function navigate() {
    if (!Auth.isLoggedIn()) { App.render(); return; }
    var r = parseHash();
    var route = routes[r.path];
    var view = document.getElementById('view');

    if (!route) { location.hash = '#/dashboard'; return; }
    if (route.minRole && !Auth.hasRole(route.minRole)) {
      view.innerHTML = '<div class="card empty-state">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>';
      return;
    }

    setActiveNav(r.path);
    view.innerHTML = '<div class="loader">กำลังโหลด...</div>';
    Promise.resolve(route.render(view, r.params)).catch(function (e) {
      view.innerHTML = '<div class="card empty-state">เกิดข้อผิดพลาด: ' + U.escapeHtml(e.message || e) + '</div>';
    });
    closeSidebar();
  }

  function setActiveNav(path) {
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#/' + path);
    });
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('show');
  }

  window.addEventListener('hashchange', navigate);
  return { navigate: navigate, parseHash: parseHash };
})();
