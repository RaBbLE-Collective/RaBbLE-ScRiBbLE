/**
 * RaBbLE-render.js — two-layer glow renderer for ink strokes.
 *
 * Same technique as NeBuLA's AmbientField (RaBbLE-NeBuLA/src/effects/
 * ambient-field.js): draw the stroke once on a flat top canvas, draw it
 * again (brighter/thicker) on an underlying canvas that has CSS
 * `filter: blur()` applied — the compositor does the blur on its own
 * thread, so the glow costs zero JS/Skia time. `mix-blend-mode: screen`
 * on the glow canvas gives the additive bloom look.
 *
 * World-space model: canvases keep a viewport-sized backing store (cheap
 * on memory) and use ctx.setTransform to map world coordinates to device
 * pixels, so the "infinite canvas" is unbounded without ever allocating a
 * huge canvas. Panning/zooming therefore requires a full redraw (raster
 * pixels don't move when the transform changes) — see redrawAll().
 *
 * Exposes window.Scribble.Renderer.
 */
(function () {
  'use strict';

  var GLOW_WIDTH_MULT = 2.6;
  var GLOW_ALPHA = 0.9;
  var FLAT_ALPHA = 0.95;

  function Renderer(flatCanvas, glowCanvas) {
    this._flat = flatCanvas;
    this._glow = glowCanvas;
    this._fctx = flatCanvas.getContext('2d');
    this._gctx = glowCanvas.getContext('2d');
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._cam = { x: 0, y: 0, zoom: 1 };
  }

  Renderer.prototype.resize = function (cssWidth, cssHeight) {
    var w = Math.max(1, Math.round(cssWidth * this._dpr));
    var h = Math.max(1, Math.round(cssHeight * this._dpr));
    [this._flat, this._glow].forEach(function (cv) {
      cv.width = w;
      cv.height = h;
      cv.style.width = cssWidth + 'px';
      cv.style.height = cssHeight + 'px';
    });
    this._applyTransform();
  };

  Renderer.prototype.setCamera = function (cam) {
    this._cam = cam;
    this._applyTransform();
  };

  Renderer.prototype._applyTransform = function () {
    var d = this._dpr, c = this._cam;
    [this._fctx, this._gctx].forEach(function (ctx) {
      ctx.setTransform(c.zoom * d, 0, 0, c.zoom * d, c.x * d, c.y * d);
    });
  };

  Renderer.prototype.worldToScreen = function (wx, wy) {
    return { x: wx * this._cam.zoom + this._cam.x, y: wy * this._cam.zoom + this._cam.y };
  };

  Renderer.prototype.screenToWorld = function (sx, sy) {
    return { x: (sx - this._cam.x) / this._cam.zoom, y: (sy - this._cam.y) / this._cam.zoom };
  };

  Renderer.prototype.clear = function () {
    var w = this._flat.width, h = this._flat.height;
    [this._fctx, this._gctx].forEach(function (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.restore();
    });
  };

  function strokePath(ctx, points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }

  // Draws a full stroke (used on full redraw / undo / load).
  Renderer.prototype.drawStroke = function (stroke) {
    var pts = stroke.points;
    if (pts.length === 0) return;
    if (pts.length === 1) {
      this._dot(pts[0], stroke.color, stroke.width);
      return;
    }
    var fctx = this._fctx, gctx = this._gctx;

    fctx.lineJoin = fctx.lineCap = 'round';
    gctx.lineJoin = gctx.lineCap = 'round';

    fctx.strokeStyle = stroke.color;
    fctx.globalAlpha = FLAT_ALPHA;
    fctx.lineWidth = stroke.width;
    strokePath(fctx, pts);
    fctx.stroke();
    fctx.globalAlpha = 1;

    gctx.strokeStyle = stroke.color;
    gctx.globalAlpha = GLOW_ALPHA;
    gctx.lineWidth = stroke.width * GLOW_WIDTH_MULT;
    strokePath(gctx, pts);
    gctx.stroke();
    gctx.globalAlpha = 1;
  };

  Renderer.prototype._dot = function (pt, color, width) {
    var fctx = this._fctx, gctx = this._gctx;
    fctx.beginPath();
    fctx.arc(pt.x, pt.y, width / 2, 0, Math.PI * 2);
    fctx.fillStyle = color;
    fctx.globalAlpha = FLAT_ALPHA;
    fctx.fill();
    fctx.globalAlpha = 1;

    gctx.beginPath();
    gctx.arc(pt.x, pt.y, (width * GLOW_WIDTH_MULT) / 2, 0, Math.PI * 2);
    gctx.fillStyle = color;
    gctx.globalAlpha = GLOW_ALPHA;
    gctx.fill();
    gctx.globalAlpha = 1;
  };

  // Incrementally draws one segment of the *active* stroke (no clear needed —
  // camera doesn't change mid-stroke, so appending pixels is correct and
  // avoids redrawing the whole scene on every pointermove).
  Renderer.prototype.drawSegment = function (p0, p1, color, width) {
    var fctx = this._fctx, gctx = this._gctx;
    fctx.lineJoin = fctx.lineCap = 'round';
    gctx.lineJoin = gctx.lineCap = 'round';

    fctx.strokeStyle = color;
    fctx.globalAlpha = FLAT_ALPHA;
    fctx.lineWidth = width;
    fctx.beginPath();
    fctx.moveTo(p0.x, p0.y);
    fctx.lineTo(p1.x, p1.y);
    fctx.stroke();
    fctx.globalAlpha = 1;

    gctx.strokeStyle = color;
    gctx.globalAlpha = GLOW_ALPHA;
    gctx.lineWidth = width * GLOW_WIDTH_MULT;
    gctx.beginPath();
    gctx.moveTo(p0.x, p0.y);
    gctx.lineTo(p1.x, p1.y);
    gctx.stroke();
    gctx.globalAlpha = 1;
  };

  Renderer.prototype.redrawAll = function (strokes) {
    this.clear();
    for (var i = 0; i < strokes.length; i++) this.drawStroke(strokes[i]);
  };

  window.Scribble = window.Scribble || {};
  window.Scribble.Renderer = Renderer;
}());
