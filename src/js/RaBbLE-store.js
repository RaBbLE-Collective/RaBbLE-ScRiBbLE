/**
 * RaBbLE-store.js — IndexedDB persistence for the single 'default' board.
 * v1 is local-only: one board record, no library, debounced autosave.
 * Exposes window.Scribble.store = { load(), save(board), flush() }.
 */
(function () {
  'use strict';

  var DB_NAME = 'rabble-scribble';
  var DB_VERSION = 1;
  var STORE_NAME = 'boards';
  var BOARD_ID = 'default';
  var SAVE_DEBOUNCE_MS = 500;

  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function emptyBoard() {
    return { id: BOARD_ID, strokes: [], textBoxes: [], updatedAt: Date.now() };
  }

  function load() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var req = tx.objectStore(STORE_NAME).get(BOARD_ID);
        req.onsuccess = function () { resolve(req.result || emptyBoard()); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function (err) {
      console.error('[ScRiBbLE] IndexedDB load failed, starting with an empty board:', err);
      return emptyBoard();
    });
  }

  function writeNow(board) {
    board.updatedAt = Date.now();
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(board);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function (err) {
      console.error('[ScRiBbLE] IndexedDB save failed:', err);
    });
  }

  var saveTimer = null;
  var pendingBoard = null;

  function save(board) {
    pendingBoard = board;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      var toWrite = pendingBoard;
      pendingBoard = null;
      writeNow(toWrite);
    }, SAVE_DEBOUNCE_MS);
  }

  function flush() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (pendingBoard) {
      var toWrite = pendingBoard;
      pendingBoard = null;
      return writeNow(toWrite);
    }
    return Promise.resolve();
  }

  window.Scribble = window.Scribble || {};
  window.Scribble.store = { load: load, save: save, flush: flush };
}());
