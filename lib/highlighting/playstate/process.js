'use babel'

import PlayStateParser from './parser';

const LOCK_INIT_PLAYSTATE = "INIT_PLAYSTATE";
const LOCK_EXTEND_PLAYSTATE = "EXTEND_PLAYSTATE";

const activeKey = (event) =>
  `${event.eventId}_${event.colStart}_${event.whole.start.toFixed(6)}_${event.whole.stop.toFixed(6)}_${event.id || ""}`;

export class PlayStateProcessor {

  constructor(markerStore, ghci) {
    this.markerStore = markerStore;
    this.ghci = ghci;
    this.lockInit = LOCK_INIT_PLAYSTATE;
    this.lockExtend = LOCK_EXTEND_PLAYSTATE;
    this.currentPlayState = {};
    this.activeEvents = {};
    this.sam = 0;
    this.onSamChange = null;
    this.onPlayStateChange = null;
    this.onParsedOutputChange = null;
    this.handleMessageCallback = null;
  }

  diff(sam, prevActive, current) {
    const remove = [];
    const add = [];
    const active = [];

    if (sam !== null && sam !== undefined) {
      if (Object.keys(current).length > 0) {
        for (const key of Object.keys(prevActive)) {
          if (current[key] === undefined) remove.push(key);
        }
      }
      for (const [key, tidalEvent] of Object.entries(current)) {
        if (tidalEvent === undefined || tidalEvent.whole === undefined) continue;
        if (tidalEvent.whole.stop <= sam) remove.push(key);
        if (tidalEvent.whole.start <= sam && tidalEvent.whole.stop >= sam) {
          if (prevActive[key] === undefined) add.push(key);
          else active.push(key);
        }
      }
    }

    return { remove, add, active };
  }

  updateActive(active, current) {
    const removable = {};
    const keepable = {};
    const currentLookup = {};

    for (const [currentId, currentEvent] of Object.entries(current)) {
      if (currentEvent && currentEvent.whole) {
        currentLookup[activeKey(currentEvent)] = { id: currentId, event: currentEvent };
      }
    }

    for (const [activeId, activeEvent] of Object.entries(active)) {
      if (activeEvent && activeEvent.whole) {
        const found = currentLookup[activeKey(activeEvent)];
        if (found) keepable[found.id] = found.event;
        else removable[activeId] = activeEvent;
      } else {
        removable[activeId] = activeEvent;
      }
    }

    return { removable, active: keepable };
  }

  getMarker(id, playState) {
    const playEvent = playState[id];
    if (!playEvent) return null;
    return this.markerStore.get(playEvent.eventId, playEvent.colStart) || null;
  }

  cleanHighlights(removableEvents) {
    for (const id of Object.keys(removableEvents)) {
      const marker = this.getMarker(id, removableEvents);
      if (marker !== null) {
        this.markerStore.removeHighlight({ eventId: marker.eventId, colStart: marker.colStart });
      }
    }
  }

  setSam(sam) {
    if (sam === null || sam === undefined) return;

    const prevSam = this.sam;
    this.sam = sam;

    if (prevSam === null || prevSam === undefined) this.init();

    const intSam = Math.floor(sam);
    if (this.onSamChange) this.onSamChange(sam);

    if (prevSam !== null && prevSam !== undefined && Math.floor(prevSam) !== intSam
      && Object.keys(this.currentPlayState).length > 0) {
      this.getPlayState(intSam + 3, intSam + 4, LOCK_EXTEND_PLAYSTATE);
    }
  }

  handleEvents() {
    const events = this.diff(this.sam, this.activeEvents, this.currentPlayState);

    const activeMessages = [];

    for (const id of events.remove) {
      const removeCandidate = this.activeEvents[id];
      let shallBeRemoved = true;

      if (removeCandidate === undefined) {
        shallBeRemoved = false;
      } else {
        for (const event of Object.values(this.activeEvents)) {
          if (event !== undefined && event.whole !== undefined && removeCandidate.whole !== undefined
            && event.colStart === removeCandidate.colStart
            && event.eventId === removeCandidate.eventId
            && event.whole.stop > removeCandidate.whole.stop) {
            shallBeRemoved = false;
          }
        }
      }

      if (shallBeRemoved) {
        const marker = this.getMarker(id, this.activeEvents);
        if (marker !== null) {
          this.markerStore.removeHighlight({ eventId: marker.eventId, colStart: marker.colStart });
        }
      }

      delete this.activeEvents[id];
      delete this.currentPlayState[id];
    }

    for (const id of events.add) {
      const marker = this.getMarker(id, this.currentPlayState);

      this.activeEvents[id] = this.currentPlayState[id];

      if (marker !== null) {
        this.markerStore.applyHighlight({ id: this.currentPlayState[id].id, eventId: marker.eventId, colStart: marker.colStart });
        activeMessages.push(marker);
      }
    }

    for (const id of events.active) {
      const marker = this.getMarker(id, this.currentPlayState);
      if (marker !== null) activeMessages.push(marker);
    }

    if (this.handleMessageCallback) this.handleMessageCallback(activeMessages);
  }

  parse(list, lock) {
    const result = {};
    const parsedEvents = [];

    for (const raw of list) {
      const [parsedEvent, mappedEvents] = PlayStateParser.parse(raw);

      parsedEvents.push(parsedEvent);

      if (mappedEvents !== undefined) {
        for (const [key, parsed] of Object.entries(mappedEvents)) {
          const marker = this.markerStore.get(parsed.eventId, parsed.colStart);
          if (marker) {
            parsed.fun = marker.functionName;
            parsed.val = marker.originalText;
            parsed.quoteIndex = marker.quoteIndex;
          }
          result[key] = parsed;
        }
      }
    }

    if (this.onParsedOutputChange) {
      this.onParsedOutputChange({ [lock]: parsedEvents });
    }

    return result;
  }

  onDataProcessed(output) {
    if (output.length <= 2) return;

    const first = output[0];

    if (first.includes(LOCK_EXTEND_PLAYSTATE)) {
      const lines = this.#removeFirstAndLast(output);
      const parsedOutput = this.parse(lines, LOCK_EXTEND_PLAYSTATE);
      for (const [key, parsed] of Object.entries(parsedOutput)) {
        this.currentPlayState[key] = parsed;
      }
      if (this.onPlayStateChange) this.onPlayStateChange(this.currentPlayState);
      return;
    }

    if (first.includes(LOCK_INIT_PLAYSTATE)) {
      const lines = this.#removeFirstAndLast(output);
      const parsedOutput = this.parse(lines, LOCK_INIT_PLAYSTATE);

      this.currentPlayState = parsedOutput;

      const updatedEvents = this.updateActive(this.activeEvents, this.currentPlayState);
      this.cleanHighlights(updatedEvents.removable);
      this.activeEvents = updatedEvents.active;

      if (this.onPlayStateChange) this.onPlayStateChange(this.currentPlayState);

      this.markerStore.cleanUpMarkers();
      return;
    }
  }

  reset() {
    this.currentPlayState = {};
    this.sam = null;
  }

  getPlayState(start, stop, lock) {
    if (start === undefined || stop === undefined || !this.ghci) return;

    this.ghci.writeLine(`:{\nputStrLn "${lock}_START"\n:}`);
    this.ghci.writeLine(`streamActivePt tidal (Arc ${start} ${stop})`);
    this.ghci.writeLine(`:{\nputStrLn "${lock}_END"\n:}`);
  }

  init() {
    const sam = this.sam;
    if (sam !== null && sam !== undefined && Object.keys(this.currentPlayState).length === 0) {
      const intSam = Math.floor(sam);
      this.getPlayState(intSam, intSam + 5, LOCK_INIT_PLAYSTATE);
    }
  }

  #removeFirstAndLast(t) {
    if (!t || t.length < 2) return t;
    return t.slice(1, -1);
  }
}

export default PlayStateProcessor;
