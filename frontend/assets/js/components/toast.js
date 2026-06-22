/** การแจ้งเตือนชั่วคราว (toast) */
window.Toast = (function () {
  function show(msg, type, ms) {
    var root = document.getElementById('toast-root');
    var t = U.el('<div class="toast ' + (type || '') + '">' + U.escapeHtml(msg) + '</div>');
    root.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity .25s';
      setTimeout(function () { t.remove(); }, 250);
    }, ms || 2800);
  }
  return {
    show: show,
    success: function (m) { show(m, 'success'); },
    error: function (m) { show(m, 'error', 4000); }
  };
})();
