'use babel'

import { Range, Point, CompositeDisposable } from "atom"; // eslint-disable-line no-unused-vars
import path from "path"; // eslint-disable-line no-unused-vars
const osc = require('osc-min');

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

    /** @type {TextEditor|null} */
    this.editor = null;

    // Data‑structures -------------------------------------------------------
    this.markers = new Map();              // row → (col → Marker)
    this.highlights = new Map();           // eventId → (col → Marker)
    this.filteredMessages = new Map();     // eventId → (col → event)
    this.receivedThisFrame = new Map();    // eventId → (col → event)
    this.addedThisFrame = new Set();       // Set<event>
    this.oscStyleIds = new Set();            // received ids
    this.eventIds = []; //

    // Animation state -------------------------------------------------------
    this.then = 0; // time at previous frame

    // Bind instance methods used as callbacks -----------------------------
    this.animate = this.animate.bind(this);
  }

  /** Initialise OSC listeners & start animation loop */
  init() {
    this.#installBaseHighlightStyle();

    // Kick‑off animation loop
    this.then = window.performance.now();
    requestAnimationFrame(this.animate);
  }

  /** Clean‑up resources when package is deactivated */
  destroy() {
    try {
      this.server?.destroy();
    } catch (e) {
      this.consoleView.logStderr(`OSC server encountered an error while destroying:\n${e}`);
    }
  }

  // ----------------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------------

  setCurrentEditor(editor) {
    this.editor = editor;
  }

  /**
   * Inject additional metadata into a TidalCycles mini‑notation line.
   * Returns transformed line (string).
   */
  addMetadata(line, lineNumber) {
    this.#createPositionMarkers(line, lineNumber);

    // Replace quoted segments with `(deltaContext …)` unless they belong to
    // known control‑pattern contexts.
    return line.replace(/"([^"]*)"/g, (match, content, offset) => {
      const before = line.slice(0, offset);
      if (/numerals\s*=.*$|p\s.*$/.test(before)) return match; // ignore control‑patterns

      this.eventIds.push({
        rowStart: lineNumber,
        bufferId: this.editors.currentEditor().buffer.id
      });

      return `(deltaContext ${offset} ${this.eventIds.length - 1} "${content}")`;
    });
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

  handleStyleMessage(payload) {
      this.oscStyleIds.add(payload["id"]);

      atom.styles.addStyleSheet(`
            .${CLASS.oscPrefix}${payload["id"]}
            ${payload["css"]}
          `);
  }

  /** Handle OSC message describing a highlight event */
  oscHighlightSubscriber() {
      return (message: {}): void => {
        this.#queueEvent(message);
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

  /** Store events until the next animation frame */
  #queueEvent(event) {
    const eventMap = ensureNestedMap(this.filteredMessages, event.eventId);
    const recvMap = ensureNestedMap(this.receivedThisFrame, event.eventId);

    if (!eventMap.has(event.colStart)) eventMap.set(event.colStart, event);
    if (!recvMap.has(event.colStart)) {
      this.addedThisFrame.add(event);
      recvMap.set(event.colStart, event);
    }
  }

  /** requestAnimationFrame callback */
  animate(now) {
    const elapsed = now - this.then;
    const configFPS = atom.config.get('tidalcycles.eventHighlighting.fps');
    const fpsInterval = 1000 / configFPS;
    const isFeatureEnabled = atom.config.get('tidalcycles.eventHighlighting.enable');

    if (!isFeatureEnabled) {
      // Remove highlights no longer present ------------------------------
      const { removed } = this.#diffEventMaps(
        this.filteredMessages,
        new Map()
      );

      removed.forEach((evt) => this.#removeHighlight(evt));
    }

    if (elapsed >= fpsInterval && isFeatureEnabled) {
      this.then = now - (elapsed % fpsInterval);

      // Add newly‑received highlights -------------------------------------
      this.addedThisFrame.forEach((evt) => {
        this.#addHighlight(evt);
      });

      // Remove highlights no longer present ------------------------------
      const { updated, removed } = this.#diffEventMaps(
        this.filteredMessages,
        this.receivedThisFrame,
      );
      this.filteredMessages = updated;
      removed.forEach((evt) => this.#removeHighlight(evt));

      // Reset per‑frame collections --------------------------------------
      this.receivedThisFrame.clear();
      this.addedThisFrame.clear();
    }

    requestAnimationFrame(this.animate);
  }

  // ----------------------------------------------------------------------
  // Highlight management
  // ----------------------------------------------------------------------

  #addHighlight({ id, colStart, eventId }) {
    if (!this.editor) return;

    const rowMarkers = this.markers.get(this.eventIds[eventId].rowStart);
    const baseMarker = rowMarkers?.get(colStart);

    if (!baseMarker?.isValid()) return;

    const highlightEvent = ensureNestedMap(this.highlights, eventId);


    if (highlightEvent.has(colStart)) return; // already highlighted

    const marker = this.editor.markBufferRange(baseMarker.getBufferRange(), {
      invalidate: "inside",
    });

    // Base style
    this.editor.decorateMarker(marker, { type: "text", class: CLASS.base });

    // Style by numeric id
    this.editor.decorateMarker(marker, { type: "text", class: `${CLASS.idPrefix}${id}` });

    if (this.oscStyleIds.has(id)) {
      this.editor.decorateMarker(marker, { type: "text", class: `${CLASS.oscPrefix}${id}` });
    }

    highlightEvent.set(colStart, marker);
  }

  #removeHighlight({ colStart, eventId }) {
    const highlightEvent = this.highlights.get(eventId);
    const highlight = highlightEvent?.get(colStart);
    if (!highlight) return;

    highlight.destroy();
    highlightEvent.delete(colStart);
  }

  // ----------------------------------------------------------------------
  // Marker generation (per line)
  // ----------------------------------------------------------------------

  /**
   * Builds Atom markers for every word inside quoted mini‑notation strings so
   * that OSC events can map onto them later.
   */
  #createPositionMarkers(line, lineNumber) {
    const rowMarkers = ensureNestedMap(this.markers, lineNumber);

    const quoted = /"([^"]*)"/g;
    const atoms = /[~\w:.-]+/g; // valid Tidal word tokens

    let quoteMatch;
    while ((quoteMatch = quoted.exec(line))) {
      const quotedText = quoteMatch[1];
      const quoteStart = quoteMatch.index + 1; // skip opening quote

      let atomMatch;
      while ((atomMatch = atoms.exec(quotedText))) {
        const raw = atomMatch[0];
        const parts = raw.split(/[*!@]/); // split 1*4, 1!4, …

        let offset = 0;
        for (const part of parts) {
          if (!part.trim()) continue;

          const start = quoteStart + atomMatch.index + offset;
          const end = start + part.length;

          const range = [[lineNumber, start], [lineNumber, end]];
          const marker = this.editor.markBufferRange(range, { invalidate: "inside" });
          rowMarkers.set(start, marker);

          offset += part.length + 1;
        }
      }
    }
  }

  // ----------------------------------------------------------------------
  // Utilities
  // ----------------------------------------------------------------------
  #diffEventMaps(prevEvents, currentEvents) {
    const removed = new Set();
    const updated = new Map(prevEvents);

    for (const [event, prevCols] of prevEvents) {
      const currCols = currentEvents.get(event);
      if (!currCols) {
        for (const [, prevEvt] of prevCols) removed.add(prevEvt);
        updated.delete(event);
        continue;
      }

      for (const [col, prevEvt] of prevCols) {
        if (!currCols.has(col)) {
          removed.add(prevEvt);
          updated.get(event).delete(col);
        }
      }
    }

    return { updated, removed };
  }
}
