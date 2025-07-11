'use babel'

import OscServer from './osc-server';
import LineProcessor from './line-processor';

if (!Set.prototype.union) {
  Set.prototype.union = function (otherSet) {
    return new Set([...this, ...otherSet])
  }
}

const CLASS = Object.freeze({
  base: "event-highlight",
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
    this.eventIds = [];                    // [{textbufferId, row}]
    this.messageBuffer = new Map();
    this.activeMessages = new Map();

    this.then = 0;

    this.animate = this.animate.bind(this);
  }

  // ----------------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------------

  /** Initialise OSC listeners & start animation loop */
  init() {
    this.#installBaseHighlightStyle();

    this.then = window.performance.now();
    requestAnimationFrame(this.animate);
  }

  /** requestAnimationFrame callback */
  animate(now) {
    const elapsed = now - this.then;

    const configFPS = atom.config.get('tidalcycles.eventHighlighting.fps');
    const missThreshold = atom.config.get('tidalcycles.eventHighlighting.missThreshold');
    const delay = atom.config.get('tidalcycles.eventHighlighting.delay');

    const fpsInterval = 1000 / configFPS;
    let activeThisFrame = new Set();

    if (elapsed >= fpsInterval) {
      this.then = now - (elapsed % fpsInterval);

      [...this.messageBuffer.entries()]
        .filter(([ts]) => (ts + (delay * -1)) < this.then)
        .forEach(([ts, event]) => {
            activeThisFrame = activeThisFrame.union(event);
            this.messageBuffer.delete(ts);
          }
        );

      const { active, added, removed } = this.#diffEventMaps(
        this.activeMessages,
        this.#transformedEvents(activeThisFrame)
      );

      removed.forEach(evt => {
        const cols = this.activeMessages.get(evt.eventId);
        if (cols) {
          cols.delete(evt.colStart);
          if (cols.size === 0) {
            this.activeMessages.delete(evt.eventId);
          }
        }
      });

      this.activeMessages = this.#transformedEvents(
        [...active, ...added]
      );

      added.forEach((evt) => {
        this.#addHighlight(evt);
      });

      removed.forEach((evt) => this.#removeHighlight(evt));

    }

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

  /** Handle OSC message describing a highlight event */
  oscHighlightSubscriber() {
      return (args: {}): void => {
        const message = OscServer.asDictionary(this.highlightTransformer(args));
        this.#queueEvent(message);
      }
  }


  highlightTransformer(args) {
    const result = [
            {value: "time"}, {value: args[0]},
            {value: "id"}, args[1],
            {value: "duration"}, args[2],
            {value: "cycle"}, args[3],
            {value: "colStart"}, args[4],
            {value: "eventId"}, {value: args[5].value - 1},
            {value: "colEnd"}, args[6],
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

       textEditorEvent.set(colStart, marker);
    });
  }

  #removeHighlight({ colStart, eventId }) {

    const highlightEvents = this.highlights.get(eventId);

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

  #ensureNestedMap(root, key) {
    if (!root.has(key)) root.set(key, new Map());
    return root.get(key);
  }

  #queueEvent(event) {
    if (!this.messageBuffer.has(event.time)) this.messageBuffer.set(event.time, new Set());
    this.messageBuffer.get(event.time).add(event);
  }

  #diffEventMaps(prevEvents, currentEvents) {
      const removed = new Set();
      const added = new Set();
      const active = new Set();

      for (const [event, prevCols] of prevEvents) {
        const currCols = currentEvents.get(event);
        if (!currCols) {
          for (const [, prevEvt] of prevCols) removed.add(prevEvt);
          continue;
        }

        for (const [col, prevEvt] of prevCols) {
          if (!currCols.has(col)) {
            removed.add(prevEvt);
          } else {
            active.add(prevEvt);
          }
        }
      }

      for (const [event, currCols] of currentEvents) {
        const prevCols = prevEvents.get(event);
        if (!prevCols) {
          for (const [, currEvt] of currCols) added.add(currEvt);
          continue;
        }

        for (const [col, currEvt] of currCols) {
          if (!prevCols.has(col)) {
            added.add(currEvt);
          }
        }
      }

      return { removed, added, active };
  }

  #transformedEvents(events) {
    const resultEvents = new Map();
    events.forEach(event => {
      if (!resultEvents.get(event.eventId)) {
        resultEvents.set(event.eventId, new Map());
      }
      const cols = resultEvents.get(event.eventId);

      cols.set(event.colStart, event);
    });

    return resultEvents;
  }

}
