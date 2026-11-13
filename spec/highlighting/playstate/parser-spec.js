'use babel'

const PlayStateParser = require("../../../lib/highlighting/playstate/parser").PlayStateParser;

describe('PlayStateParser', () => {

  describe('mapCtx', () => {
    it('should parse (col, eventId) pairs', () => {
      expect(PlayStateParser.mapCtx('[(8,2),(18,2)]')).toEqual([[8, 2], [18, 2]]);
    });

    it('should return an empty list for pairs without content', () => {
      expect(PlayStateParser.mapCtx('[]')).toEqual([]);
    });
  });

  describe('mapEvent', () => {
    it('should map a full event row with context positions', () => {
      const [whole, perPosition] = PlayStateParser.mapEvent(
        'd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano'
      );

      expect(whole).toEqual({
        id: 'd1',
        whole: { start: 0, stop: 1 },
        note: 0,
        sound: 'superpiano',
      });

      const entries = Object.values(perPosition);
      expect(entries.length).toEqual(2);
      expect(entries[0]).toEqual({
        id: 'd1',
        eventId: 1,
        colStart: 8,
        whole: { start: 0, stop: 1 },
      });
      expect(entries[1]).toEqual({
        id: 'd1',
        eventId: 1,
        colStart: 18,
        whole: { start: 0, stop: 1 },
      });
    });

    it('should map fractional cycle windows', () => {
      const [whole] = PlayStateParser.mapEvent(
        '1,[(8,3)],1,2,3,4,1,3,superpiano'
      );

      expect(whole.whole).toEqual({ start: 0.5, stop: 0.75 });
      expect(whole.note).toEqual(1 / 3);
    });

    it('should return empty for rows without a context list', () => {
      const [whole, perPosition] = PlayStateParser.mapEvent('d1,garbage,0,1');

      expect(whole).toBeUndefined();
      expect(perPosition).toBeUndefined();
    });
  });
});
