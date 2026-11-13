'use babel'

// Minimal mock of the Pulsar editor surface used by the event highlighting
// modules. Mirrors the real TextEditor/Marker/decoration APIs the code touches.
export class MockBuffer {
  constructor(id) {
    this.id = id;
  }
}

export class MockMarker {
  constructor(range) {
    const start = Array.isArray(range) ? range[0] : range.start;
    const end = Array.isArray(range) ? range[1] : range.end;
    this.range = {
      start: { row: start[0] !== undefined ? start[0] : start.row, column: start[1] !== undefined ? start[1] : start.column },
      end: { row: end[0] !== undefined ? end[0] : end.row, column: end[1] !== undefined ? end[1] : end.column },
    };
    this.destroyed = false;
  }

  getBufferRange() {
    return this.range;
  }

  getStartBufferPosition() {
    return this.range.start;
  }

  getEndBufferPosition() {
    return this.range.end;
  }

  isValid() {
    return !this.destroyed;
  }

  destroy() {
    this.destroyed = true;
  }
}

export class MockEditor {
  constructor(id, bufferId, lines) {
    this.id = id;
    this.buffer = new MockBuffer(bufferId);
    this.lines = lines;
    this.markers = [];
    this.decorations = [];
  }

  getBuffer() {
    return this.buffer;
  }

  getGrammar() {
    return { scopeName: 'source.tidalcycles' };
  }

  lineTextForBufferRow(row) {
    return this.lines[row] || "";
  }

  getTextInBufferRange(range) {
    const start = Array.isArray(range) ? { row: range[0][0], column: range[0][1] } : range.start;
    const end = Array.isArray(range) ? { row: range[1][0], column: range[1][1] } : range.end;
    const line = this.lines[start.row] || "";
    return line.slice(start.column, end.column);
  }

  markBufferRange(range, options) {
    const marker = new MockMarker(range);
    this.markers.push(marker);
    return marker;
  }

  decorateMarker(marker, options) {
    const decoration = { marker, options };
    this.decorations.push(decoration);
    return decoration;
  }
}

// Stub for the Editors dependency: currentEditor() + editorsGroupedByTextBufferId().
export class MockEditors {
  constructor() {
    this.current = null;
    this.groups = {};
  }

  currentEditor() {
    return this.current;
  }

  editorsGroupedByTextBufferId() {
    return this.groups;
  }

  setEditor(editor) {
    this.current = editor;
    this.groups[editor.buffer.id] = [editor];
  }
}

export function makeEditor(id, bufferId, lines) {
  return new MockEditor(id, bufferId, lines);
}
