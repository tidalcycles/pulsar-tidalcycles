'use babel'

export default class MarkerStore {

  constructor(editors, styles) {
    this.editors = editors;
    this.styles = styles;
    // eventId → colStart → record
    this.extMarks = new Map();
    this.removeCandidates = [];
  }

  // Port of Marker.createMarkers(ranges, lineNumber, eventId). `ranges` come
  // from LineProcessor.findTidalWordRanges (0-based, `end` inclusive).
  createMarkers(ranges, row, eventId) {
    const editor = this.editors.currentEditor();
    if (!editor) return;

    const bufferId = editor.getBuffer().id;
    const eventMarkers = this.#ensureEvent(eventId);

    for (const range of ranges) {
      const lineText = editor.lineTextForBufferRow(row) || "";
      // clamp to end of line (nvim: safe_end_col)
      const safeEnd = Math.min(range.end + 1, lineText.length);

      const bufferRange = [[row, range.start], [row, safeEnd]];
      const baseMarker = editor.markBufferRange(bufferRange, { invalidate: "inside" });
      const originalText = editor.getTextInBufferRange(bufferRange);

      eventMarkers.set(range.start, {
        eventId,
        bufferId,
        baseMarker,
        row,
        colStart: range.start,
        colEnd: range.end,
        functionName: range.functionName || "",
        quoteIndex: range.quoteIndex,
        originalText,
        trackId: null,
        highlightMarkers: new Map(), // editor.id → editor marker
      });
    }
  }

  get(eventId, colStart) {
    return this.extMarks.get(eventId)?.get(colStart);
  }

  setRemovables(startRow, endRow) {
    for (const records of this.extMarks.values()) {
      for (const record of records.values()) {
        if (!record.baseMarker?.isValid()) continue;
        const row = record.baseMarker.getStartBufferPosition().row;
        if (row >= startRow && row <= endRow) {
          this.removeCandidates.push(record);
        }
      }
    }
  }

  cleanUpMarkers() {
    for (const record of this.removeCandidates) {
      this.#destroyRecord(record);
    }
    this.removeCandidates = [];
  }

  cleanRowRange(startRow, endRow) {
    this.setRemovables(startRow, endRow);
    this.cleanUpMarkers();
  }

  wipeAll() {
    for (const records of this.extMarks.values()) {
      for (const record of records.values()) {
        this.#destroyRecord(record);
      }
    }
    this.extMarks = new Map();
    this.removeCandidates = [];
  }

  applyHighlight(event) {
    const record = this.get(event.eventId, event.colStart);
    if (!record || !record.baseMarker?.isValid()) return null;

    const editors = this.editors.editorsGroupedByTextBufferId()[record.bufferId] || [];
    for (const editor of editors) {
      const marker = record.highlightMarkers.get(editor.id);
      if (marker?.isValid() && record.trackId === event.id) continue; // already highlighted

      if (marker?.isValid()) marker.destroy();

      const editorMarker = editor.markBufferRange(record.baseMarker.getBufferRange(), {
        invalidate: "inside",
      });
      editor.decorateMarker(editorMarker, { type: "text", class: "event-highlight" });
      if (this.styles?.hasOscStyle(event.id)) {
        editor.decorateMarker(editorMarker, { type: "text", class: `event-highlight-osc-${event.id}` });
      }
      editor.decorateMarker(editorMarker, { type: "text", class: `event-highlight-${event.id}` });
      record.highlightMarkers.set(editor.id, editorMarker);
    }
    record.trackId = event.id;

    return record;
  }

  removeHighlight(event) {
    const record = this.get(event.eventId, event.colStart);
    if (!record) return;

    record.highlightMarkers.forEach((marker) => marker.destroy());
    record.highlightMarkers.clear();
    record.trackId = null;
  }

  #ensureEvent(eventId) {
    if (!this.extMarks.has(eventId)) this.extMarks.set(eventId, new Map());
    return this.extMarks.get(eventId);
  }

  #destroyRecord(record) {
    record.highlightMarkers.forEach((marker) => marker.destroy());
    record.highlightMarkers.clear();
    record.baseMarker?.destroy();

    const records = this.extMarks.get(record.eventId);
    if (records) {
      records.delete(record.colStart);
      if (records.size === 0) this.extMarks.delete(record.eventId);
    }
  }
}
