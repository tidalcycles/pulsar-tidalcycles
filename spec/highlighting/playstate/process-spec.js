'use babel'

const PlayStateProcessor = require("../../../lib/highlighting/playstate/process").PlayStateProcessor;

const playEvent = (eventId, colStart, start, stop, id) => ({
  eventId, colStart,
  whole: { start, stop },
  id: id || 'd1',
});

function makeMarkerStore() {
  return {
    get: jasmine.createSpy('get').and.returnValue(undefined),
    applyHighlight: jasmine.createSpy('applyHighlight'),
    removeHighlight: jasmine.createSpy('removeHighlight'),
    cleanUpMarkers: jasmine.createSpy('cleanUpMarkers'),
  };
}

describe('PlayStateProcessor', () => {

  describe('diff', () => {
    it('should add events covering sam', () => {
      const processor = new PlayStateProcessor(makeMarkerStore());
      const current = { a: playEvent(1, 8, 0, 1) };

      const diff = processor.diff(0.5, {}, current);

      expect(diff.add).toEqual(['a']);
      expect(diff.remove).toEqual([]);
      expect(diff.active).toEqual([]);
    });

    it('should remove events whose stop has passed', () => {
      const processor = new PlayStateProcessor(makeMarkerStore());
      const prev = { a: playEvent(1, 8, 0, 1) };

      const diff = processor.diff(1.5, prev, prev);

      expect(diff.remove).toEqual(['a']);
    });

    it('should keep already applied events active', () => {
      const processor = new PlayStateProcessor(makeMarkerStore());
      const current = { a: playEvent(1, 8, 0, 1) };

      const diff = processor.diff(0.5, { a: current.a }, current);

      expect(diff.active).toEqual(['a']);
      expect(diff.add).toEqual([]);
    });
  });

  describe('updateActive', () => {
    it('should keep events still present in the refreshed window', () => {
      const processor = new PlayStateProcessor(makeMarkerStore());
      const active = { a: playEvent(1, 8, 0, 1) };
      const current = { b: playEvent(1, 8, 0, 1) }; // same identity, new generated id

      const result = processor.updateActive(active, current);

      // nvim semantics: the old generated id is replaced by the new one,
      // it does not become removable.
      expect(Object.keys(result.active)).toEqual(['b']);
      expect(result.removable).toEqual({});
    });

    it('should drop events missing from the refreshed window', () => {
      const processor = new PlayStateProcessor(makeMarkerStore());
      const active = { a: playEvent(1, 8, 0, 1) };
      const current = { b: playEvent(2, 9, 1, 2) }; // unrelated new event

      const result = processor.updateActive(active, current);

      expect(result.active).toEqual({});
      expect(Object.keys(result.removable)).toEqual(['a']);
    });
  });

  describe('handleEvents', () => {
    it('should apply highlights for added events with known markers', () => {
      const markerStore = makeMarkerStore();
      const record = { eventId: 1, colStart: 8 };
      markerStore.get.and.returnValue(record);
      const processor = new PlayStateProcessor(markerStore);
      processor.currentPlayState = { a: playEvent(1, 8, 0, 1, 'd1') };

      processor.setSam(0.5);
      processor.handleEvents();

      expect(markerStore.applyHighlight).toHaveBeenCalledWith({
        id: 'd1', eventId: 1, colStart: 8,
      });
      expect(processor.activeEvents['a']).toBeDefined();
    });

    it('should skip highlights for events without a matching marker', () => {
      const markerStore = makeMarkerStore(); // get returns undefined
      const processor = new PlayStateProcessor(markerStore);
      processor.currentPlayState = { a: playEvent(1, 8, 0, 1, 'd1') };

      processor.setSam(0.5);
      processor.handleEvents();

      expect(markerStore.applyHighlight).not.toHaveBeenCalled();
      expect(processor.activeEvents['a']).toBeDefined();
    });
  });

  describe('setSam', () => {
    it('should request the initial playstate window after a reset', () => {
      const ghci = { writeLine: jasmine.createSpy('writeLine') };
      const processor = new PlayStateProcessor(makeMarkerStore(), ghci);
      processor.reset();

      processor.setSam(5.3);

      const lines = ghci.writeLine.calls.allArgs().map(args => args[0]);
      expect(lines).toContain(':{\nputStrLn "INIT_PLAYSTATE_START"\n:}');
      expect(lines).toContain('streamActivePt tidal (Arc 5 10)');
      expect(lines).toContain(':{\nputStrLn "INIT_PLAYSTATE_END"\n:}');
    });

    it('should extend the window on integer cycle crossings', () => {
      const ghci = { writeLine: jasmine.createSpy('writeLine') };
      const processor = new PlayStateProcessor(makeMarkerStore(), ghci);
      processor.currentPlayState = { a: playEvent(1, 8, 0, 1) };

      processor.setSam(5.0);
      processor.setSam(6.0);

      const lines = ghci.writeLine.calls.allArgs().map(args => args[0]);
      expect(lines).toContain('streamActivePt tidal (Arc 9 10)');
    });
  });

  describe('onDataProcessed', () => {
    let markerStore;
    let processor;

    beforeEach(() => {
      markerStore = makeMarkerStore();
      processor = new PlayStateProcessor(markerStore);
    });

    it('should replace the current playstate on INIT blocks and clean markers', () => {
      processor.onDataProcessed([
        'INIT_PLAYSTATE_START',
        'd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano',
        'INIT_PLAYSTATE_END',
      ]);

      expect(Object.keys(processor.currentPlayState).length).toEqual(2);
      expect(markerStore.cleanUpMarkers).toHaveBeenCalled();
    });

    it('should merge the current playstate on EXTEND blocks', () => {
      processor.onDataProcessed([
        'INIT_PLAYSTATE_START',
        'd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano',
        'INIT_PLAYSTATE_END',
      ]);
      const before = Object.keys(processor.currentPlayState);

      processor.onDataProcessed([
        'EXTEND_PLAYSTATE_START',
        'd2,[(3,4)],2,1,3,1,0,1,superpiano',
        'EXTEND_PLAYSTATE_END',
      ]);

      expect(Object.keys(processor.currentPlayState).length).toBeGreaterThan(before.length);
    });

    it('should tolerate a GHCi prompt prefix on the marker line', () => {
      processor.onDataProcessed([
        't> INIT_PLAYSTATE_START',
        'd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano',
        't> INIT_PLAYSTATE_END',
      ]);

      expect(Object.keys(processor.currentPlayState).length).toEqual(2);
      expect(markerStore.cleanUpMarkers).toHaveBeenCalled();
    });

    it('should enrich parsed events with marker metadata', () => {
      markerStore.get.and.returnValue({
        functionName: 's', originalText: 'superpiano', quoteIndex: 1,
      });

      processor.onDataProcessed([
        'INIT_PLAYSTATE_START',
        'd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano',
        'INIT_PLAYSTATE_END',
      ]);

      const enriched = Object.values(processor.currentPlayState).find(e => e.colStart === 8);
      expect(enriched.fun).toEqual('s');
      expect(enriched.val).toEqual('superpiano');
      expect(enriched.quoteIndex).toEqual(1);
    });
  });
});
