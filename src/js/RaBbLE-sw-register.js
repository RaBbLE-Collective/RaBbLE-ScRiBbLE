// Moved out of index.html (S333) so the Content-Security-Policy can refuse inline script.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('[ScRiBbLE] service worker registration failed:', err);
    });
  });
}
