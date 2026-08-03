/**
 * RaBbLE-aether-loader.js — Aether design system loader + health monitor.
 * Same technique as RaBbLE-World/world/js/RaBbLE-aether.js: single point of
 * import for Aether CSS, loaded synchronously (no defer) so the <link> is
 * injected during HTML parsing. On failure: marks <html data-aether="failed">
 * and inserts a visible banner — degraded mode is visible, never silent.
 */
(function () {
  'use strict';

  var AETHER_URL = window.RABBLE_AETHER_URL || 'https://aether.joinrabble.world/v0.0.0.1-rc.1/aether.min.css';

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = AETHER_URL;
  link.id = 'aether-css';
  document.head.appendChild(link);

  var fired = false;

  function showAetherFailed() {
    if (fired) return;
    fired = true;

    document.documentElement.dataset.aether = 'failed';

    var banner = document.createElement('div');
    banner.id = 'aether-fail-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = [
      'position:fixed;top:0;left:0;right:0;z-index:9999',
      'padding:5px 14px;text-align:center',
      'background:rgba(224,92,111,0.12)',
      'border-bottom:1px solid rgba(224,92,111,0.45)',
      'color:#e05c6f',
      'font-family:monospace',
      'font-size:10px;letter-spacing:.12em;text-transform:uppercase',
    ].join(';');
    banner.textContent = '⚠ aether failed — degraded visual mode · ' + AETHER_URL;

    function insertBanner() {
      if (document.body) {
        document.body.insertBefore(banner, document.body.firstChild);
      } else {
        document.addEventListener('DOMContentLoaded', insertBanner);
      }
    }
    insertBanner();
  }

  link.addEventListener('error', showAetherFailed);

  window.addEventListener('load', function () {
    if (!getComputedStyle(document.documentElement).getPropertyValue('--rabble-magenta').trim()) {
      showAetherFailed();
    }
  });
}());
