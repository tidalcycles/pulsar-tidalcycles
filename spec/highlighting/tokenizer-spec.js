'use babel'

const Tokenizer = require("../../lib/highlighting/tokenizer");
const { MockEditors, makeEditor } = require("../helpers/mocks");

describe('Tokenizer', () => {

  describe('addDeltaContext function', () => {
    beforeEach(() => {
      Tokenizer.reset();
    });

    it('should transform control patterns into deltaContext format', () => {
      expect(Tokenizer.addDeltaContext('d1 $ s "bd"', 1))
        .toEqual('d1 $ s (deltaContext 7 1 "bd")');
    });

    it('should ignore lines that start with a colon', () => {
      expect(Tokenizer.addDeltaContext(':load "test.hs"', 1))
        .toEqual(':load "test.hs"');
    });

    it('should leave plain lines unchanged', () => {
      expect(Tokenizer.addDeltaContext('regular line without patterns', 1))
        .toEqual('regular line without patterns');
    });

    it('should handle empty lines', () => {
      expect(Tokenizer.addDeltaContext("", 1)).toEqual("");
    });

    it('should use the provided event ID in deltaContext', () => {
      expect(Tokenizer.addDeltaContext('d1 $ s "bd"', 42))
        .toEqual('d1 $ s (deltaContext 7 42 "bd")');
    });

    it('should handle multiple control patterns in one line', () => {
      expect(Tokenizer.addDeltaContext('d1 $ s "bd" # n "0"', 1))
        .toEqual('d1 $ s (deltaContext 7 1 "bd") # n (deltaContext 16 1 "0")');
    });

    it('should keep quotes for excepted numerals definitions', () => {
      expect(Tokenizer.addDeltaContext('numerals = "0 1 2 3"', 1))
        .toEqual('numerals = "0 1 2 3"');
    });

    it('should keep quotes for excepted p definitions', () => {
      expect(Tokenizer.addDeltaContext('p "hello" $ s "808"', 1))
        .toEqual('p "hello" $ s "808"');
    });
  });

  describe('addMetadata function', () => {
    let markerStore;

    beforeEach(() => {
      Tokenizer.reset();
      markerStore = jasmine.createSpyObj('markerStore', ['createMarkers']);
    });

    it('should increment the event id and create markers per token', () => {
      const result = Tokenizer.addMetadata('d1 $ s "bd"', 3, markerStore);

      expect(result).toEqual('d1 $ s (deltaContext 7 1 "bd")');
      expect(Tokenizer.lastEventId).toEqual(1);
      expect(markerStore.createMarkers).toHaveBeenCalledWith(
        [{ start: 8, end: 9, functionName: 's', quoteIndex: 1 }],
        3,
        1
      );
    });

    it('should assign a new event id per enriched line', () => {
      Tokenizer.addMetadata('d1 $ s "bd"', 0, markerStore);
      Tokenizer.addMetadata('d2 $ n "0"', 1, markerStore);

      expect(Tokenizer.lastEventId).toEqual(2);
      expect(markerStore.createMarkers.calls.mostRecent().args[2]).toEqual(2);
    });

    it('should not create markers or transform lines without quoted words', () => {
      const result = Tokenizer.addMetadata('d1 $ sound [bd]', 0, markerStore);

      expect(result).toEqual('d1 $ sound [bd]');
      expect(Tokenizer.lastEventId).toEqual(0);
      expect(markerStore.createMarkers).not.toHaveBeenCalled();
    });

    it('should not transform colon commands', () => {
      const result = Tokenizer.addMetadata(':script "test.hs"', 0, markerStore);

      expect(result).toEqual(':script "test.hs"');
    });
  });

  describe('lastEventId', () => {
    it('should reset to the event id base', () => {
      Tokenizer.lastEventId = 99;
      Tokenizer.reset();

      expect(Tokenizer.lastEventId).toEqual(0);
    });
  });
});
