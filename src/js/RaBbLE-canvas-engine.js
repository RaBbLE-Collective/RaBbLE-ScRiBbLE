/**
 * RaBbLE-canvas-engine.js — pointer input, camera, board state, undo.
 *
 * Input model (matches standard iPad note-app conventions — GoodNotes,
 * Notability): Apple Pencil (pointerType 'pen') always draws/erases,
 * regardless of the tool's own logic, since Safari reports it as a
 * distinct pointerType from finger touches. A single finger or mouse also
 * draws (so mouse/trackpad remains fully usable per Mark's ask). Two
 * simultaneous finger touches pan + zoom together (pinch), which also
 * doubles as palm rejection: touch-action:none plus this pointerType
 * split means a resting palm never fights the pencil. On a device with
 * no touch digitizer, mouse wheel / trackpad scroll pans, and ctrl/meta
 * + wheel zooms (see _onWheel) — the pinch gesture above is unreachable
 * without a touchscreen, so this is desktop's only pan/zoom path.
 *
 * Colors are the RaBbLE-Palette.md core neons, written as literal hex
 * because the canvas 2D API needs concrete color strings — see the
 * "Colors" rule in this repo's AGENT.md.
 */
(function () {
  'use strict';

  var COLORS = {
    white:   '#e8e6f0',
    violet:  '#bf5fff',
    cyan:    '#00f5ff',
    magenta: '#ff2d78',
  };

  var BASE_PEN_WIDTH = 4;
  var BASE_ERASE_RADIUS = 14;
  var MIN_ZOOM = 0.2;
  var MAX_ZOOM = 6;
  // Tunable by feel — trackpad "naturalness" is hardware/driver-dependent
  // (untested on a ProArt P16 trackpad specifically). If pan/zoom feels too
  // fast or too slow, adjust these two first.
  var ZOOM_WHEEL_SENSITIVITY = 0.006;
  var WHEEL_DELTA_CAP = 120;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  window.Scribble = window.Scribble || {};
  window.Scribble.COLORS = COLORS;
  // Shared mutable UI state — Toolbar writes tool/colorKey, Engine + TextTool read it.
  window.Scribble.state = { tool: 'pen', colorKey: 'white' };

  function widthForPressure(pointerType, pressure) {
    var p = (pointerType === 'pen') ? pressure : 0.6;
    if (!p || p <= 0) p = 0.5;
    return BASE_PEN_WIDTH * (0.45 + Math.min(1, p) * 1.15);
  }

  function dist(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function Engine(canvas, renderer, board, onBoardChange) {
    this._canvas = canvas;
    this._renderer = renderer;
    this.board = board;
    this._onBoardChange = onBoardChange || function () {};

    // Persisted on board.camera so a reload reopens exactly where the user
    // left off — strokes are stored in world space relative to whatever
    // camera was active when drawn, so restoring a *different* camera on
    // load makes everything appear to jump off-screen.
    this.camera = board.camera || { x: 0, y: 0, zoom: 1 };
    this._undoStack = [];

    this._active = null;        // in-progress draw/erase state
    this._pointers = new Map(); // pointerId -> {x,y,type}
    this._gesture = null;       // active 2-touch pan/zoom gesture

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onWheel = this._onWheel.bind(this);

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('pointerup', this._onPointerUp);
    canvas.addEventListener('pointercancel', this._onPointerUp);
    // Desktop mouse/trackpad — pinch gestures above are touchscreen-only, so
    // this is the only pan/zoom path available without a touch digitizer.
    // { passive: false } is required for preventDefault() to actually stop
    // the browser's own page-zoom/scroll on ctrl+wheel and two-finger scroll.
    canvas.addEventListener('wheel', this._onWheel, { passive: false });

    this._applyCamera();
  }

  Engine.prototype._applyCamera = function () {
    this._renderer.setCamera(this.camera);
  };

  Engine.prototype._redraw = function () {
    this._renderer.redrawAll(this.board.strokes);
  };

  Engine.prototype._touchPointerIds = function () {
    var ids = [];
    this._pointers.forEach(function (p, id) {
      if (p.type === 'touch') ids.push(id);
    });
    return ids;
  };

  Engine.prototype._onPointerDown = function (e) {
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });

    var touchIds = this._touchPointerIds();
    if (touchIds.length === 2 && !this._gesture) {
      if (this._active && this._active.pointerType === 'touch') this._cancelActive();
      this._startGesture(touchIds);
      return;
    }
    if (this._gesture || touchIds.length > 2) return;
    if (window.Scribble.state.tool === 'text') return; // TextTool owns tap-to-place
    if (this._active) return; // already drawing with another pointer

    this._canvas.setPointerCapture(e.pointerId);
    var world = this._screenPointFromEvent(e);
    var tool = window.Scribble.state.tool;

    if (tool === 'eraser') {
      this._active = { kind: 'erase', pointerId: e.pointerId, pointerType: e.pointerType, removed: [] };
      this._eraseAt(world);
    } else {
      var colorKey = window.Scribble.state.colorKey;
      var stroke = {
        id: 'st_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        color: COLORS[colorKey] || COLORS.white,
        width: widthForPressure(e.pointerType, e.pressure),
        points: [world],
      };
      this._active = { kind: 'draw', pointerId: e.pointerId, pointerType: e.pointerType, stroke: stroke };
      this._renderer.drawStroke({ color: stroke.color, width: stroke.width, points: [world] });
    }
  };

  Engine.prototype._screenPointFromEvent = function (e) {
    var rect = this._canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    return this._renderer.screenToWorld(sx, sy);
  };

  Engine.prototype._onPointerMove = function (e) {
    if (this._pointers.has(e.pointerId)) {
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    }

    if (this._gesture && this._gesture.ids.indexOf(e.pointerId) !== -1) {
      this._updateGesture();
      return;
    }

    if (!this._active || this._active.pointerId !== e.pointerId) return;
    var world = this._screenPointFromEvent(e);

    if (this._active.kind === 'draw') {
      var stroke = this._active.stroke;
      var prev = stroke.points[stroke.points.length - 1];
      stroke.width = widthForPressure(e.pointerType, e.pressure);
      stroke.points.push(world);
      this._renderer.drawSegment(prev, world, stroke.color, stroke.width);
    } else if (this._active.kind === 'erase') {
      this._eraseAt(world);
    }
  };

  Engine.prototype._onPointerUp = function (e) {
    this._pointers.delete(e.pointerId);

    if (this._gesture && this._gesture.ids.indexOf(e.pointerId) !== -1) {
      this._gesture = null;
      return;
    }

    if (!this._active || this._active.pointerId !== e.pointerId) return;

    if (this._active.kind === 'draw') {
      var stroke = this._active.stroke;
      if (stroke.points.length > 0) {
        this.board.strokes.push(stroke);
        this._pushUndo({ type: 'add', strokeId: stroke.id });
        this._onBoardChange(this.board);
      }
    } else if (this._active.kind === 'erase') {
      if (this._active.removed.length > 0) {
        this._pushUndo({ type: 'erase', strokes: this._active.removed });
        this._onBoardChange(this.board);
      }
    }
    this._active = null;
  };

  Engine.prototype._cancelActive = function () {
    if (this._active && this._active.kind === 'erase' && this._active.removed.length > 0) {
      this._pushUndo({ type: 'erase', strokes: this._active.removed });
      this._onBoardChange(this.board);
    }
    this._active = null;
    this._redraw();
  };

  Engine.prototype._eraseAt = function (world) {
    var radius = BASE_ERASE_RADIUS / this.camera.zoom;
    var kept = [];
    var removedHere = [];
    for (var i = 0; i < this.board.strokes.length; i++) {
      var s = this.board.strokes[i];
      var hit = false;
      for (var j = 0; j < s.points.length; j++) {
        if (dist(s.points[j].x, s.points[j].y, world.x, world.y) <= radius) { hit = true; break; }
      }
      if (hit) removedHere.push(s); else kept.push(s);
    }
    if (removedHere.length > 0) {
      this.board.strokes = kept;
      this._active.removed = this._active.removed.concat(removedHere);
      this._redraw();
    }
  };

  Engine.prototype._startGesture = function (ids) {
    var p0 = this._pointers.get(ids[0]), p1 = this._pointers.get(ids[1]);
    this._gesture = {
      ids: ids,
      startZoom: this.camera.zoom,
      startCam: { x: this.camera.x, y: this.camera.y },
      startMid: { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
      startDist: dist(p0.x, p0.y, p1.x, p1.y) || 1,
    };
  };

  Engine.prototype._updateGesture = function () {
    var g = this._gesture;
    var p0 = this._pointers.get(g.ids[0]), p1 = this._pointers.get(g.ids[1]);
    if (!p0 || !p1) return;

    var rect = this._canvas.getBoundingClientRect();
    var mid = { x: (p0.x + p1.x) / 2 - rect.left, y: (p0.y + p1.y) / 2 - rect.top };
    var d = dist(p0.x, p0.y, p1.x, p1.y) || 1;

    var newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, g.startZoom * (d / g.startDist)));

    var startMidLocal = { x: g.startMid.x - rect.left, y: g.startMid.y - rect.top };
    var worldAtStart = {
      x: (startMidLocal.x - g.startCam.x) / g.startZoom,
      y: (startMidLocal.y - g.startCam.y) / g.startZoom,
    };

    this._commitCamera({
      zoom: newZoom,
      x: mid.x - worldAtStart.x * newZoom,
      y: mid.y - worldAtStart.y * newZoom,
    });
  };

  // Desktop mouse/trackpad pan + zoom — the only pan/zoom path on a device
  // with no touch digitizer. Plain wheel/two-finger-scroll pans; ctrl/meta+
  // wheel (how browsers report trackpad pinch, and how "hold ctrl + scroll"
  // reads on a plain mouse wheel) zooms, anchored under the cursor so the
  // point you're pointing at stays put — same anchoring math as the touch
  // pinch gesture above.
  Engine.prototype._onWheel = function (e) {
    e.preventDefault();
    if (this._gesture || this._active) return; // don't fight an active touch/draw gesture

    var rect = this._canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left, sy = e.clientY - rect.top;

    // Clamp per-event delta before scaling: a precision trackpad sends many
    // small deltas per second (smooth), but a plain mouse wheel notch or an
    // OS momentum-scroll tail can spike to 100+ in one event — without this,
    // that single event would jump the zoom/pan far more than the gesture
    // that produced it actually meant to.
    var dx = clamp(e.deltaX, -WHEEL_DELTA_CAP, WHEEL_DELTA_CAP);
    var dy = clamp(e.deltaY, -WHEEL_DELTA_CAP, WHEEL_DELTA_CAP);

    if (e.ctrlKey || e.metaKey) {
      var worldAtCursor = this._renderer.screenToWorld(sx, sy);
      var factor = Math.exp(-dy * ZOOM_WHEEL_SENSITIVITY);
      var newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.camera.zoom * factor));
      this._commitCamera({
        zoom: newZoom,
        x: sx - worldAtCursor.x * newZoom,
        y: sy - worldAtCursor.y * newZoom,
      });
    } else {
      this._commitCamera({
        zoom: this.camera.zoom,
        x: this.camera.x - dx,
        y: this.camera.y - dy,
      });
    }
  };

  Engine.prototype._commitCamera = function (camera) {
    this.camera = camera;
    this.board.camera = camera;
    this._applyCamera();
    this._redraw();
    if (this._onCameraChange) this._onCameraChange(this.camera);
    this._onBoardChange(this.board);
  };

  Engine.prototype._pushUndo = function (action) {
    this._undoStack.push(action);
    if (this._undoStack.length > 100) this._undoStack.shift();
  };

  Engine.prototype.undo = function () {
    var action = this._undoStack.pop();
    if (!action) return;

    if (action.type === 'add') {
      var idx = this.board.strokes.findIndex(function (s) { return s.id === action.strokeId; });
      if (idx !== -1) this.board.strokes.splice(idx, 1);
    } else if (action.type === 'erase') {
      this.board.strokes = this.board.strokes.concat(action.strokes);
    } else if (action.type === 'clear') {
      this.board.strokes = action.strokes;
      this.board.textBoxes = action.textBoxes;
    }
    this._redraw();
    this._onBoardChange(this.board);
    if (this._onTextBoxesRestored) this._onTextBoxesRestored();
  };

  Engine.prototype.clear = function () {
    if (this.board.strokes.length === 0 && this.board.textBoxes.length === 0) return;
    this._pushUndo({ type: 'clear', strokes: this.board.strokes, textBoxes: this.board.textBoxes });
    this.board.strokes = [];
    this.board.textBoxes = [];
    this._redraw();
    this._onBoardChange(this.board);
    if (this._onTextBoxesRestored) this._onTextBoxesRestored();
  };

  Engine.prototype.resize = function (cssWidth, cssHeight) {
    this._renderer.resize(cssWidth, cssHeight);
    this._applyCamera();
    this._redraw();
  };

  Engine.prototype.loadBoard = function (board) {
    this.board = board;
    this._redraw();
  };

  window.Scribble.Engine = Engine;
}());
