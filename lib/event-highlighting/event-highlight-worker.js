const EventMapHelper = require('./event-map-helper')

require("../polyfills/set");

const FRAME_RATE = 1000/30;

let messageBuffer = new Map();
let receivedThisFrame = new Map();

self.onmessage = function(e) {
  const event = e.data;

  queueEvent(event);
};

setInterval(() => {
    const {active, added, removed} = EventMapHelper.diffEventMaps(
      messageBuffer,
      receivedThisFrame,
    );

    postMessage({active, added, removed });
    messageBuffer = EventMapHelper.setToMap(added.union(active));
    receivedThisFrame.clear();

}, FRAME_RATE);

/** Helper that creates (or returns existing) nested maps. */
function ensureNestedMap(root, key) {
  if (!root.has(key)) root.set(key, new Map());
  return root.get(key);
}

/** Store events until the next animation frame */
function queueEvent(event) {
  const recvMap = ensureNestedMap(receivedThisFrame, event.eventId);

  if (!recvMap.has(event.colStart)) {
    recvMap.set(event.colStart, event);
  }
}
