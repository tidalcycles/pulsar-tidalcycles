
const EventMapHelper = require("../../lib/event-highlighting/event-map-helper");

require("../../lib/polyfills/set");

/* TEST DATA */
const messageBuffer = new Map([
  [20, new Map([
    [8, {id: 1, colStart: 8, eventId: 20}],
    [32, {id: 1, colStart: 32, eventId: 20}]
  ])],
  [33, new Map([
    [10, {id: 2, colStart: 10, eventId: 33}],
  ])]
]);

const receivedMessagesThisFrame = new Map([
  [20, new Map([
    [8, {id: 1, colStart: 8, eventId: 20}],
  ])],
  [33, new Map([
    [10, {id: 2, colStart: 10, eventId: 33}],
  ])],
  [50, new Map([
    [24, {id: 3, colStart: 24, eventId: 50}],
  ])]
]);

describe('Event Map Helper', () => {

  describe('diffEventMaps', () => {

      it('should return the correct differences for deleted events', () => {
        const {removed} = EventMapHelper.diffEventMaps(messageBuffer,receivedMessagesThisFrame);

        expectedResult = new Set([ {id: 1, colStart: 32, eventId: 20 }]);

        expect([...removed]).toEqual([...expectedResult]);
      })

      it('should return the correct differences for added events', () => {
        const {added} = EventMapHelper.diffEventMaps(messageBuffer,receivedMessagesThisFrame);

        expectedResult = new Set([ {id: 3, colStart: 24, eventId: 50 }]);

        expect([...added]).toEqual([...expectedResult]);
      })

      it('should return the correct differences for active events', () => {
        const {active} = EventMapHelper.diffEventMaps(messageBuffer,receivedMessagesThisFrame);

        const expectedResult = new Set([
          { id: 1, colStart: 8, eventId: 20 }
          , { id: 2, colStart: 10, eventId: 33 }
        ]);

        expect([...active]).toEqual([...expectedResult]);

      })
  })

  describe('setToMap', () => {
      it('should return the setToMap Sets into correspondings Maps', () => {
        const events = new Set([
          { id: 1, colStart: 8, eventId: 20 }
          , { id: 2, colStart: 10, eventId: 33 }
          , { id: 3, colStart: 24, eventId: 50 }
        ]);

        const setToMap = EventMapHelper.setToMap(events);

        const expectedResult = new Map([
          [20, new Map([
            [8, {id: 1, colStart: 8, eventId: 20}]
          ])],
          [33, new Map([
            [10, {id: 2, colStart: 10, eventId: 33}]
          ])],
          [50, new Map([
            [24, {id: 3, colStart: 24, eventId: 50}]
          ])]
        ]);

        expect(setToMap).toEqual(expectedResult);
      })
  })
})
