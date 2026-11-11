/**
 * RaBbLE-toolbar.js — tool/color/undo/clear controls + brand mark.
 *
 * All chrome (buttons, dock, glass panel) is Aether: `.rabble-btn`,
 * `.rabble-dock`, `.rabble-glass` from the CDN bundle — nothing here is a
 * hand-rolled button. The brand mark reuses NeBuLA's `createEntityMini`,
 * which already ships an 'e-scribble' palette
 * (RaBbLE-NeBuLA/src/ui/entity-mini.js) — same lightweight SVG mark used
 * for other members' chrome, not a new component.
 */
(function () {
  'use strict';

  function Toolbar(root, appEl, engine) {
    this._root = root;
    this._appEl = appEl;
    this._engine = engine;

    this._toolButtons = Array.prototype.slice.call(root.querySelectorAll('[data-tool]'));
    this._swatches = Array.prototype.slice.call(root.querySelectorAll('.scribble-swatch'));
    this._undoBtn = root.querySelector('#btnUndo');
    this._clearBtn = root.querySelector('#btnClear');
    this._entityMount = root.querySelector('#entityMark');

    this._wireTools();
    this._wireSwatches();
    this._wireActions();
    this._mountEntity();

    this._setTool(window.Scribble.state.tool);
    this._setColor(window.Scribble.state.colorKey);
  }

  Toolbar.prototype._wireTools = function () {
    var self = this;
    this._toolButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._setTool(btn.dataset.tool);
      });
    });
  };

  Toolbar.prototype._setTool = function (tool) {
    window.Scribble.state.tool = tool;
    this._appEl.dataset.tool = tool;
    this._toolButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.tool === tool);
    });
  };

  Toolbar.prototype._wireSwatches = function () {
    var self = this;
    this._swatches.forEach(function (sw) {
      sw.addEventListener('click', function () {
        self._setColor(sw.dataset.color);
        if (window.Scribble.state.tool !== 'pen') self._setTool('pen');
      });
    });
  };

  Toolbar.prototype._setColor = function (colorKey) {
    window.Scribble.state.colorKey = colorKey;
    this._swatches.forEach(function (sw) {
      sw.classList.toggle('is-active', sw.dataset.color === colorKey);
    });
  };

  Toolbar.prototype._wireActions = function () {
    var self = this;
    this._undoBtn.addEventListener('click', function () { self._engine.undo(); });
    this._clearBtn.addEventListener('click', function () { self._engine.clear(); });
  };

  Toolbar.prototype._mountEntity = function () {
    var self = this;
    function mount() {
      if (!window.NeBuLA || !window.NeBuLA.ui || !self._entityMount) return;
      var mini = window.NeBuLA.ui.createEntityMini('e-scribble', { size: 30 });
      self._entityMount.appendChild(mini.el);
    }
    if (window.NeBuLA) mount();
    else window.addEventListener('rabble:nebula-ready', mount, { once: true });
  };

  window.Scribble = window.Scribble || {};
  window.Scribble.Toolbar = Toolbar;
}());
