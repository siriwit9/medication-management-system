/* Service Worker — cache app shell แบบเรียบง่าย (network-first สำหรับ API ไม่ถูก cache) */
var CACHE = 'medstock-v1';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/config.js',
  './assets/js/utils.js',
  './assets/js/api.js',
  './assets/js/auth.js',
  './assets/js/router.js',
  './assets/js/app.js'
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
  // ไม่ cache คำขอ API (Apps Script) หรือ POST
  if (e.request.method !== 'GET' || url.indexOf('script.google.com') >= 0 || url.indexOf('googleusercontent') >= 0) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (res) {
        return res;
      }).catch(function () { return cached; });
    })
  );
});
