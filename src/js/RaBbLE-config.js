/* RaBbLE-config.js — CDN base URLs for Aether + NeBuLA.
 *
 * ScRiBbLE has no local dev-serve of its own (no bundler, no Aether/NeBuLA
 * source checkout expected) — it always consumes the live CDN bundles, the
 * same ones World serves in production. Load this FIRST, before
 * RaBbLE-aether-loader.js and RaBbLE-nebula-loader.js, which read the
 * window.RABBLE_*_URL values set here. Override either by setting the
 * corresponding window.RABBLE_*_URL before this script runs.
 */
(function () {
  'use strict';

  function set(name, val) {
    if (!window[name]) window[name] = val;
  }

  set('RABBLE_AETHER_URL', 'https://aether.joinrabble.world/v0.0.0.1-rc.1/aether.min.css');
  set('RABBLE_NEBULA_URL', 'https://nebula.joinrabble.world/v0.0.0.1-rc.1/nebula.iife.js');
}());
