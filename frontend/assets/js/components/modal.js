/** Modal กลาง — open({title, body, footer, wide}) คืน element + helper ปิด */
window.Modal = (function () {
  function open(opts) {
    opts = opts || {};
    var root = document.getElementById('modal-root');
    var backdrop = U.el('<div class="modal-backdrop"></div>');
    var modal = U.el('<div class="modal ' + (opts.wide ? 'wide' : '') + '"></div>');

    var head = U.el('<div class="modal-head"><h3></h3><button class="icon-btn" data-close><span data-lucide="x"></span></button></div>');
    head.querySelector('h3').textContent = opts.title || '';
    var body = U.el('<div class="modal-body"></div>');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    modal.appendChild(head);
    modal.appendChild(body);

    var footer;
    if (opts.footer) {
      footer = U.el('<div class="modal-foot"></div>');
      if (typeof opts.footer === 'string') footer.innerHTML = opts.footer;
      else footer.appendChild(opts.footer);
      modal.appendChild(footer);
    }

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    U.refreshIcons();

    function close() { backdrop.remove(); }
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    return { backdrop: backdrop, modal: modal, body: body, footer: footer, close: close };
  }

  function confirm(opts) {
    return new Promise(function (resolve) {
      var footer = U.el('<div></div>');
      var cancel = U.el('<button class="btn">ยกเลิก</button>');
      var ok = U.el('<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '">' + U.escapeHtml(opts.okText || 'ยืนยัน') + '</button>');
      footer.appendChild(cancel); footer.appendChild(ok);
      var m = open({ title: opts.title || 'ยืนยัน', body: '<p>' + U.escapeHtml(opts.message || '') + '</p>', footer: footer });
      cancel.onclick = function () { m.close(); resolve(false); };
      ok.onclick = function () { m.close(); resolve(true); };
    });
  }

  return { open: open, confirm: confirm };
})();
