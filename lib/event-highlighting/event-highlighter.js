'use babel'

import OscServer from './../osc-server';
import LineProcessor from './line-processor';
import path from 'path';

const CLASS = Object.freeze({
  base: "event-highlight",
  oscPrefix: "event-highlight-osc-",
  idPrefix: "event-highlight-",
});

/** Helper that creates (or returns existing) nested maps. */
function ensureNestedMap(root, key) {
  if (!root.has(key)) root.set(key, new Map());
  return root.get(key);
}

/**
 * Responsible for receiving OSC events describing source‑code positions and
 * visually highlighting those regions in Pulsar TextEditor.
 */
export default class EventHighlighter {

  constructor(consoleView, editors) {
    this.consoleView = consoleView;

    this.editors = editors;

    // Data‑structures -------------------------------------------------------
    this.markers = new Map();              // textbuffer.id → row → col → Marker
    this.highlights = new Map();           // eventId → texteditor.id → col → Marker
    this.oscStyleIds = new Set();          // received ids
    this.eventIds = [];                    // [{textbufferId, row}]
    this.worker;
  }

  // ----------------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------------

  /** Initialise OSC listeners & start animation loop */
  init() {
    this.#installBaseHighlightStyle();

    this.startWorker();
  }

  startWorker() {
    const workerPath = path.join(__dirname, '.', 'event-highlight-worker.js');
    this.worker = new Worker(workerPath);

    this.worker.onmessage = function(event) {
      const {added, removed} = event.data;
      added.forEach((evt) => {
        this.#addHighlight(evt);
      });

      removed.forEach((evt) => this.#removeHighlight(evt));
    }.bind(this);
  }

  /** Clean‑up resources when package is deactivated */
  destroy() {
    try {
      this.server?.destroy();
    } catch (e) {
      this.consoleView.logStderr(`OSC server encountered an error while destroying:\n${e}`);
    }
  }

  /**
   * Inject additional metadata into a TidalCycles mini‑notation line.
   * Returns transformed line (string).
   */
  addMetadata(line, lineNumber) {
    this.#createPositionMarkers(line, lineNumber);

    // Replace quoted segments with `(deltaContext …)` unless they belong to
    // known control‑pattern contexts.
    return line.replace(LineProcessor.controlPatternsRegex(), (match, content, offset) => {
      const before = line.slice(0, offset);
      if (LineProcessor.exceptedFunctionPatterns().test(before)) return match; // ignore control‑patterns

      this.eventIds.push({
        rowStart: lineNumber,
        bufferId: this.editors.currentEditor().buffer.id
      });

      return `(deltaContext ${offset} ${this.eventIds.length - 1} "${content}")`;
    });
  }

  handleStyleMessage() {
      return (args: {}): void => {
         const message = OscServer.asDictionary(args);

         this.oscStyleIds.add(message["id"]);
         atom.styles.addStyleSheet(`
               .${CLASS.oscPrefix}${message["id"]}
               ${message["css"]}
             `);
      }
  }

  /** Handle OSC message describing a highlight event */
  oscHighlightSubscriber() {
      return (args: {}): void => {
        const message = OscServer.asDictionary(this.highlightTransformer(args));

        if (this.worker) {
          this.worker.postMessage(message);
        }
      }
  }

  highlightTransformer(args) {
    const result = [
            {value: "id"}, args[0],
            {value: "duration"}, args[1],
            {value: "cycle"}, args[2],
            {value: "colStart"}, args[3],
            {value: "eventId"}, {value: args[4].value - 1},
            {value: "colEnd"}, args[5],
          ];

    return result;
  }

  // ----------------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------------
  /** Injects the base CSS rule used for all highlights */
  #installBaseHighlightStyle() {
    atom.styles.addStyleSheet(`
      .${CLASS.base} {
        outline: 2px solid red;
        outline-offset: 0;
      }
    `);
  }

  // Highlight management
  #addHighlight({ id, colStart, eventId }) {
    const bufferId = this.eventIds[eventId].bufferId;
    const editors = this.editors.editorsGroupedByTextBufferId()[bufferId];

    if (!editors) return;

    const textBufferIdMarkers = this.markers.get(bufferId);
    const rowMarkers = textBufferIdMarkers.get(this.eventIds[eventId].rowStart);
    const baseMarker = rowMarkers?.get(colStart);

    if (!baseMarker?.isValid()) return;

    const highlightEvent = ensureNestedMap(this.highlights, eventId);

    editors.forEach(editor => {
       const textEditorEvent = ensureNestedMap(highlightEvent, editor.id);

       if (textEditorEvent.has(colStart)) return; // already highlighted

       const marker = editor.markBufferRange(baseMarker.getBufferRange(), {
         invalidate: "inside",
       });

       // Base style
       editor.decorateMarker(marker, { type: "text", class: CLASS.base });

       // Style by numeric id
       editor.decorateMarker(marker, { type: "text", class: `${CLASS.idPrefix}${id}` });

       if (this.oscStyleIds.has(id)) {
          editor.decorateMarker(marker, { type: "text", class: `${CLASS.oscPrefix}${id}` });
       }

       textEditorEvent.set(colStart, marker);
       // eventId → texteditor.id → col → Marker
    });
  }

  #removeHighlight({ colStart, eventId }) {

    const highlightEvents = this.highlights.get(eventId);
    // console.log("removeHighlight", highlightEvents, eventId, colStart);

    if (!highlightEvents || !highlightEvents.size) return;

     highlightEvents.forEach(textEditorIdEvent => {
      const marker = textEditorIdEvent.get(colStart);
      textEditorIdEvent.delete(colStart);

      if (!marker) return;
      marker.destroy();
    })
  }

  // Marker generation (per line)

  /**
   * Builds Atom markers for every word inside quoted mini‑notation strings so
   * that OSC events can map onto them later.
   */
  #createPositionMarkers(line, lineNumber) {
    const currentEditor = this.editors.currentEditor();
    const currentTextBufferId = this.editors.currentEditor().buffer.id;

    const textBufferIdMarkers = ensureNestedMap(this.markers, currentTextBufferId);
    const rowMarkers = ensureNestedMap(textBufferIdMarkers, lineNumber);

    LineProcessor.findTidalWordRanges(line, (range) => {
        const bufferRange = [[lineNumber, range.start], [lineNumber, range.end + 1]];
        const marker = currentEditor.markBufferRange(bufferRange, { invalidate: "inside" });
        rowMarkers.set(range.start, marker);
    });
  }

}
