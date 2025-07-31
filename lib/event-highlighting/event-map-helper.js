'use babel'

class EventMapHelper {

  static diffEventMaps(prevEvents, currentEvents) {
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

      return { removed, added, active};
  }

  static transformedEvents(events) {
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


module.exports = EventMapHelper;
