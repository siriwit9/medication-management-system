/* Service Worker — medstock-v2 */
var CACHE = 'medstock-v2';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/config.js',
  './assets/js/utils.js',
  './assets/js/supabase.js',
  './assets/js/api.js',
  './assets/js/auth.js',
  './assets/js/router.js',
  './assets/js/app.js',
  './assets/js/views/receipts.js',
  './assets/js/views/jhcis-import.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  // ไม่ cache คำขอ API (Apps Script / Supabase) หรือ POST
  if (e.request.method !== 'GET' || url.indexOf('script.google.com') >= 0 || url.indexOf('supabase.co') >= 0) {
    return;
  }
  // Network first สำหรับไฟล์ JS เพื่อให้ได้โค้ดอัปเดตล่าสุดเสมอ
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
