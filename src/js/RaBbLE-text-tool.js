/**
 * RaBbLE-text-tool.js — tap-to-place, drag-to-move contentEditable text boxes.
 *
 * Deliberately not a canvas-drawn text renderer: a real contentEditable
 * div gets native keyboard, cursor, selection, and autocorrect for free,
 * which is what "text input should be usable" actually needs. Boxes live
 * in the world-transformed text layer, so their on-screen position/size
 * is recomputed from world coordinates whenever the camera (pan/zoom)
 * changes — see repositionAll().
 *
 * Each box is a small wrapper (position/size) holding two children: a
 * drag handle and the contentEditable itself. They have to be separate
 * elements — a handle that lived *inside* the editable region would be
 * just more editable content (selectable, deletable by backspace), which
 * defeats the point of a dedicated "grab here to move" affordance.
 */
(function () {
  'use strict';

  var BASE_FONT_PX = 20;
  var DEFAULT_WIDTH_WORLD = 240;

  function TextTool(layerEl, engine, onBoardChange) {
    this._layer = layerEl;
    this._engine = engine;
    this._onBoardChange = onBoardChange || function () {};
    this._els = new Map(); // textBox.id -> { wrap, editable, handle }
    this._drag = null;     // in-progress handle drag

    this._onLayerPointerDown = this._onLayerPointerDown.bind(this);
    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    layerEl.addEventListener('pointerdown', this._onLayerPointerDown);

    this.renderAll();
  }

  TextTool.prototype._onLayerPointerDown = function (e) {
    if (e.target !== this._layer) return; // tapped an existing box/handle — let it handle its own logic
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
    var refs = this._createEl(box);
    this._layer.appendChild(refs.wrap);
    this._els.set(box.id, refs);
    this._positionEl(box, refs);
    refs.editable.focus();
  };

  TextTool.prototype._createEl = function (box) {
    var wrap = document.createElement('div');
    wrap.className = 'scribble-textbox-wrap';
    wrap.dataset.id = box.id;

    var handle = document.createElement('div');
    handle.className = 'scribble-textbox-handle';
    handle.title = 'Drag to move';
    handle.textContent = '⠿';

    var editable = document.createElement('div');
    editable.className = 'scribble-textbox';
    editable.contentEditable = 'true';
    editable.spellcheck = false;
    editable.textContent = box.text || '';
    editable.style.color = window.Scribble.COLORS.white;

    wrap.appendChild(handle);
    wrap.appendChild(editable);

    var self = this;
    editable.addEventListener('blur', function () {
      box.text = editable.textContent;
      box.w = Math.max(80, editable.offsetWidth / self._engine.camera.zoom);
      if (!box.text.trim()) {
        self._removeBox(box.id);
        return;
      }
      self._onBoardChange(self._engine.board);
    });
    editable.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') editable.blur();
    });

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation(); // don't let this bubble to _onLayerPointerDown and create a new box
      handle.setPointerCapture(e.pointerId);
      self._drag = {
        pointerId: e.pointerId,
        box: box,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startBoxX: box.x,
        startBoxY: box.y,
      };
      wrap.classList.add('is-dragging');
      handle.addEventListener('pointermove', self._onDragMove);
      handle.addEventListener('pointerup', self._onDragEnd);
      handle.addEventListener('pointercancel', self._onDragEnd);
    });

    return { wrap: wrap, editable: editable, handle: handle };
  };

  TextTool.prototype._onDragMove = function (e) {
    var d = this._drag;
    if (!d || e.pointerId !== d.pointerId) return;
    var zoom = this._engine.camera.zoom;
    d.box.x = d.startBoxX + (e.clientX - d.startClientX) / zoom;
    d.box.y = d.startBoxY + (e.clientY - d.startClientY) / zoom;
    var refs = this._els.get(d.box.id);
    if (refs) this._positionEl(d.box, refs);
  };

  TextTool.prototype._onDragEnd = function (e) {
    var d = this._drag;
    if (!d || e.pointerId !== d.pointerId) return;
    var refs = this._els.get(d.box.id);
    if (refs) {
      refs.wrap.classList.remove('is-dragging');
      refs.handle.removeEventListener('pointermove', this._onDragMove);
      refs.handle.removeEventListener('pointerup', this._onDragEnd);
      refs.handle.removeEventListener('pointercancel', this._onDragEnd);
    }
    this._drag = null;
    this._onBoardChange(this._engine.board);
  };

  TextTool.prototype._removeBox = function (id) {
    var board = this._engine.board;
    var idx = board.textBoxes.findIndex(function (b) { return b.id === id; });
    if (idx !== -1) board.textBoxes.splice(idx, 1);
    var refs = this._els.get(id);
    if (refs) { refs.wrap.remove(); this._els.delete(id); }
    this._onBoardChange(board);
  };

  TextTool.prototype._positionEl = function (box, refs) {
    var s = this._engine._renderer.worldToScreen(box.x, box.y);
    var zoom = this._engine.camera.zoom;
    refs.wrap.style.left = s.x + 'px';
    refs.wrap.style.top = s.y + 'px';
    refs.wrap.style.width = (box.w * zoom) + 'px';
    refs.wrap.style.fontSize = (BASE_FONT_PX * zoom) + 'px';
  };

  TextTool.prototype.repositionAll = function () {
    var self = this;
    this._engine.board.textBoxes.forEach(function (box) {
      var refs = self._els.get(box.id);
      if (refs) self._positionEl(box, refs);
    });
  };

  // Rebuilds all DOM boxes from board.textBoxes — used after load/undo/clear,
  // where the array identity changed out from under existing elements.
  TextTool.prototype.renderAll = function () {
    var self = this;
    this._els.forEach(function (refs) { refs.wrap.remove(); });
    this._els.clear();
    this._engine.board.textBoxes.forEach(function (box) {
      var refs = self._createEl(box);
      self._layer.appendChild(refs.wrap);
      self._els.set(box.id, refs);
      self._positionEl(box, refs);
    });
  };

  window.Scribble = window.Scribble || {};
  window.Scribble.TextTool = TextTool;
}());
