/** จัดการ session, บทบาท, login/logout */
window.Auth = (function () {
  var KEY = 'medstock_session';
  var ROLE_RANK = { staff: 1, pharmacist: 2, admin: 3 };
  var ROLE_LABEL = { staff: 'เจ้าหน้าที่', pharmacist: 'เภสัชกร', admin: 'ผู้ดูแลระบบ' };
  var session = null;

  function load() {
    try { session = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { session = null; }
    return session;
  }
  function save(s) { session = s; localStorage.setItem(KEY, JSON.stringify(s)); }
  function clear() { session = null; localStorage.removeItem(KEY); }

  function getToken() { return session && session.token; }
  function getUser() { return session && session.user; }
  function isLoggedIn() { return !!getToken(); }
  function role() { return session && session.user && session.user.role; }
  function hasRole(min) { return ROLE_RANK[role()] >= ROLE_RANK[min]; }

  function login(username, password) {
    return API.call('login', { username: username, password: password }).then(function (data) {
      save({ token: data.token, user: data.user });
      return data.user;
    });
  }

  function logout() {
    clear();
    location.hash = '#/login';
    window.App && window.App.render && window.App.render();
  }

  function onUnauthorized() {
    clear();
    location.hash = '#/login';
    window.App && window.App.render && window.App.render();
  }

  load();
  return {
    login: login, logout: logout, onUnauthorized: onUnauthorized,
    getToken: getToken, getUser: getUser, isLoggedIn: isLoggedIn,
    role: role, hasRole: hasRole, ROLE_LABEL: ROLE_LABEL
  };
})();
