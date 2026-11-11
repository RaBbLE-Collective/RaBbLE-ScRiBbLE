/**
 * RaBbLE-nebula-loader.js — NeBuLA bundle loader + health monitor.
 * Injects the NeBuLA IIFE bundle as a classic <script> so window.NeBuLA is
 * available synchronously after load. On failure: marks
 * <html data-nebula="failed"> and inserts a visible banner (mirrors
 * RaBbLE-aether-loader.js) — the entity mark just quietly disappears from
 * the toolbar rather than breaking the app.
 */
(function () {
  'use strict';

  var NEBULA_URL = window.RABBLE_NEBULA_URL || 'https://nebula.joinrabble.world/v0.0.0.1-rc.1/nebula.iife.js';

  var script = document.createElement('script');
  script.src = NEBULA_URL;
  script.id = 'nebula-js';

  var fired = false;

  function showNebulaFailed() {
    if (fired) return;
    fired = true;
    document.documentElement.dataset.nebula = 'failed';
    window.dispatchEvent(new CustomEvent('rabble:nebula-failed'));
  }

  script.addEventListener('error', showNebulaFailed);
  script.addEventListener('load', function () {
    if (!window.NeBuLA) showNebulaFailed();
    else window.dispatchEvent(new CustomEvent('rabble:nebula-ready'));
  });

  document.head.appendChild(script);
}());
