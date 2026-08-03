/**
 * RaBbLE-app.js — boot: load the board, wire renderer/engine/text-tool/
 * toolbar together, handle resize, flush the debounced save on unload.
 */
(function () {
  'use strict';

  function boot() {
    var appEl = document.getElementById('app');
    var viewport = document.getElementById('viewport');
    var glowCanvas = document.getElementById('glowCanvas');
    var flatCanvas = document.getElementById('flatCanvas');
    var textLayer = document.getElementById('textLayer');
    var toolbarEl = document.getElementById('toolbar');

    var renderer = new window.Scribble.Renderer(flatCanvas, glowCanvas);

    window.Scribble.store.load().then(function (board) {
      var engine = new window.Scribble.Engine(flatCanvas, renderer, board, function (updatedBoard) {
        window.Scribble.store.save(updatedBoard);
      });

      var textTool = new window.Scribble.TextTool(textLayer, engine, function (updatedBoard) {
        window.Scribble.store.save(updatedBoard);
      });

      engine._onCameraChange = function () { textTool.repositionAll(); };
      engine._onTextBoxesRestored = function () { textTool.renderAll(); };

      new window.Scribble.Toolbar(toolbarEl, appEl, engine);

      function resize() {
        var rect = viewport.getBoundingClientRect();
        engine.resize(rect.width, rect.height);
        textTool.repositionAll();
      }
      window.addEventListener('resize', resize);
      resize();

      // A board with no saved camera (first-ever load) starts centered on
      // the viewport rather than tucked in the top-left world origin.
      // Boards with a saved camera (board.camera, set on every pan/zoom —
      // see RaBbLE-canvas-engine.js) restore exactly where the user left
      // off, since strokes are stored in world space relative to whatever
      // camera was active when drawn.
      if (!board.camera) {
        var rect = viewport.getBoundingClientRect();
        engine.camera = { x: rect.width / 2, y: rect.height / 2, zoom: 1 };
        board.camera = engine.camera;
        renderer.setCamera(engine.camera);
        engine._redraw();
      }
      textTool.renderAll();

      window.addEventListener('beforeunload', function () {
        window.Scribble.store.flush();
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') window.Scribble.store.flush();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
