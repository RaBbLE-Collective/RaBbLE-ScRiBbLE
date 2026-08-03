/**
 * RaBbLE-text-tool.js — tap-to-place contentEditable text boxes.
 *
 * Deliberately not a canvas-drawn text renderer: a real contentEditable
 * div gets native keyboard, cursor, selection, and autocorrect for free,
 * which is what "text input should be usable" actually needs. Boxes live
 * in the world-transformed text layer, so their on-screen position/size
 * is recomputed from world coordinates whenever the camera (pan/zoom)
 * changes — see repositionAll().
 */
(function () {
  'use strict';

  var BASE_FONT_PX = 20;
  var DEFAULT_WIDTH_WORLD = 240;

  function TextTool(layerEl, engine, onBoardChange) {
    this._layer = layerEl;
    this._engine = engine;
    this._onBoardChange = onBoardChange || function () {};
    this._els = new Map(); // textBox.id -> DOM element

    this._onLayerPointerDown = this._onLayerPointerDown.bind(this);
    layerEl.addEventListener('pointerdown', this._onLayerPointerDown);

    this.renderAll();
  }

  TextTool.prototype._onLayerPointerDown = function (e) {
    if (e.target !== this._layer) return; // tapped an existing box — let it handle its own focus
    // Without this, the browser's default mousedown focus-handling fires right
    // after our el.focus() below and steals it straight back — the new box
    // would blur (and, being empty, self-remove) before a single key lands.
    e.preventDefault();
    var rect = this._layer.getBoundingClientRect();
    var sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    var world = this._engine._renderer.screenToWorld(sx, sy);
    var box = {
      id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      x: world.x, y: world.y, w: DEFAULT_WIDTH_WORLD, text: '',
    };
    this._engine.board.textBoxes.push(box);
    var el = this._createEl(box);
    this._layer.appendChild(el);
    this._els.set(box.id, el);
    this._positionEl(box, el);
    el.focus();
  };

  TextTool.prototype._createEl = function (box) {
    var el = document.createElement('div');
    el.className = 'scribble-textbox';
    el.contentEditable = 'true';
    el.spellcheck = false;
    el.dataset.id = box.id;
    el.textContent = box.text || '';
    el.style.color = window.Scribble.COLORS.white;

    var self = this;
    el.addEventListener('blur', function () {
      box.text = el.textContent;
      box.w = Math.max(80, el.offsetWidth / self._engine.camera.zoom);
      if (!box.text.trim()) {
        self._removeBox(box.id);
        return;
      }
      self._onBoardChange(self._engine.board);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') el.blur();
    });
    return el;
  };

  TextTool.prototype._removeBox = function (id) {
    var board = this._engine.board;
    var idx = board.textBoxes.findIndex(function (b) { return b.id === id; });
    if (idx !== -1) board.textBoxes.splice(idx, 1);
    var el = this._els.get(id);
    if (el) { el.remove(); this._els.delete(id); }
    this._onBoardChange(board);
  };

  TextTool.prototype._positionEl = function (box, el) {
    var s = this._engine._renderer.worldToScreen(box.x, box.y);
    var zoom = this._engine.camera.zoom;
    el.style.left = s.x + 'px';
    el.style.top = s.y + 'px';
    el.style.width = (box.w * zoom) + 'px';
    el.style.fontSize = (BASE_FONT_PX * zoom) + 'px';
  };

  TextTool.prototype.repositionAll = function () {
    var self = this;
    this._engine.board.textBoxes.forEach(function (box) {
      var el = self._els.get(box.id);
      if (el) self._positionEl(box, el);
    });
  };

  // Rebuilds all DOM boxes from board.textBoxes — used after load/undo/clear,
  // where the array identity changed out from under existing elements.
  TextTool.prototype.renderAll = function () {
    var self = this;
    this._els.forEach(function (el) { el.remove(); });
    this._els.clear();
    this._engine.board.textBoxes.forEach(function (box) {
      var el = self._createEl(box);
      self._layer.appendChild(el);
      self._els.set(box.id, el);
      self._positionEl(box, el);
    });
  };

  window.Scribble = window.Scribble || {};
  window.Scribble.TextTool = TextTool;
}());
