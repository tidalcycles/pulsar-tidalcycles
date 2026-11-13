'use babel'

const MarkerStore = require("../../lib/highlighting/marker-store");
const { MockEditors, makeEditor } = require("../helpers/mocks");

const range = (start, end, functionName, quoteIndex) => ({
  start, end, functionName: functionName || "", quoteIndex: quoteIndex || 0,
});

describe('MarkerStore', () => {
  let editors;
  let editor;
  let markerStore;
  let stylesStub;

  beforeEach(() => {
    editor = makeEditor('editor-1', 'buffer-1', ['d1 $ s "superpiano"']);
    editors = new MockEditors();
    editors.setEditor(editor);
    stylesStub = { hasOscStyle: () => false };
    markerStore = new MarkerStore(editors, stylesStub);
  });

  describe('createMarkers', () => {
    it('should create a base marker per token with metadata', () => {
      markerStore.createMarkers([range(8, 17, 's', 1)], 0, 1);

      const record = markerStore.get(1, 8);
      expect(record).toBeDefined();
      expect(record.row).toEqual(0);
      expect(record.colStart).toEqual(8);
      expect(record.colEnd).toEqual(17);
      expect(record.functionName).toEqual('s');
      expect(record.quoteIndex).toEqual(1);
      expect(record.originalText).toEqual('superpiano');
      expect(record.bufferId).toEqual('buffer-1');
      expect(record.baseMarker.getBufferRange()).toEqual({
        start: { row: 0, column: 8 },
        end: { row: 0, column: 18 },
      });
    });

    it('should clamp the marker end to the line length', () => {
      markerStore.createMarkers([range(0, 19, 's', 1)], 0, 1);

      const record = markerStore.get(1, 0);
      expect(record.baseMarker.getBufferRange().end.column).toEqual(19);
      expect(record.originalText).toEqual('d1 $ s "superpiano"');
    });

    it('should store multiple tokens of one line under one event id', () => {
      markerStore.createMarkers([range(8, 17, 's', 1), range(28, 28, 'note', 2)], 0, 1);

      expect(markerStore.get(1, 8)).toBeDefined();
      expect(markerStore.get(1, 28)).toBeDefined();
    });
  });

  describe('cleanRowRange', () => {
    it('should remove markers inside the row range only', () => {
      editor.lines.push('second line');
      editor.lines.push('d2 $ s "bd"');
      editor.lines.push('third line');

      markerStore.createMarkers([range(8, 17, 's', 1)], 0, 1);
      markerStore.createMarkers([range(8, 9, 's', 1)], 2, 2);

      const row0Marker = markerStore.get(1, 8).baseMarker;
      const row2Marker = markerStore.get(2, 8).baseMarker;

      markerStore.cleanRowRange(0, 0);

      expect(markerStore.get(1, 8)).toBeUndefined();
      expect(row0Marker.destroyed).toBe(true);
      expect(markerStore.get(2, 8)).toBeDefined();
      expect(row2Marker.destroyed).toBe(false);
    });
  });

  describe('setRemovables + cleanUpMarkers', () => {
    it('should select and remove in two steps', () => {
      markerStore.createMarkers([range(8, 17, 's', 1)], 0, 1);

      markerStore.setRemovables(0, 0);
      expect(markerStore.get(1, 8)).toBeDefined();

      markerStore.cleanUpMarkers();
      expect(markerStore.get(1, 8)).toBeUndefined();
    });
  });

  describe('wipeAll', () => {
    it('should destroy and forget every marker', () => {
      markerStore.createMarkers([range(8, 17, 's', 1)], 0, 1);
      markerStore.applyHighlight({ id: '1', eventId: 1, colStart: 8 });
      const record = markerStore.get(1, 8);

      markerStore.wipeAll();

      expect(record.baseMarker.destroyed).toBe(true);
      expect(markerStore.get(1, 8)).toBeUndefined();
      expect(markerStore.extMarks.size).toEqual(0);
    });
  });

  describe('applyHighlight', () => {
    beforeEach(() => {
      markerStore.createMarkers([range(8, 17, 's', 1)], 0, 1);
    });

    it('should create one decorated editor marker per editor', () => {
      const record = markerStore.applyHighlight({ id: '2', eventId: 1, colStart: 8 });

      expect(record).toBeDefined();
      expect(record.trackId).toEqual('2');
      const marker = record.highlightMarkers.get('editor-1');
      expect(marker).toBeDefined();
      expect(editor.decorations.map(d => d.options.class)).toEqual([
        'event-highlight', 'event-highlight-2',
      ]);
    });

    it('should add the osc class when a dynamic style is registered', () => {
      stylesStub.hasOscStyle = (id) => id === '2';

      markerStore.applyHighlight({ id: '2', eventId: 1, colStart: 8 });

      expect(editor.decorations.map(d => d.options.class)).toEqual([
        'event-highlight', 'event-highlight-osc-2', 'event-highlight-2',
      ]);
    });

    it('should not re-decorate when already highlighted with the same id', () => {
      markerStore.applyHighlight({ id: '2', eventId: 1, colStart: 8 });
      const decorationCount = editor.decorations.length;

      markerStore.applyHighlight({ id: '2', eventId: 1, colStart: 8 });

      expect(editor.decorations.length).toEqual(decorationCount);
    });

    it('should recreate the editor marker when the id changes', () => {
      const first = markerStore.applyHighlight({ id: '2', eventId: 1, colStart: 8 });
      const firstMarker = first.highlightMarkers.get('editor-1');

      const second = markerStore.applyHighlight({ id: '3', eventId: 1, colStart: 8 });
      const secondMarker = second.highlightMarkers.get('editor-1');

      expect(firstMarker.destroyed).toBe(true);
      expect(secondMarker).not.toBe(firstMarker);
      expect(second.trackId).toEqual('3');
    });

    it('should return null for unknown events', () => {
      expect(markerStore.applyHighlight({ id: '2', eventId: 99, colStart: 8 })).toBeNull();
    });
  });

  describe('removeHighlight', () => {
    it('should destroy editor markers and keep the base anchor', () => {
      markerStore.createMarkers([range(8, 17, 's', 1)], 0, 1);
      markerStore.applyHighlight({ id: '2', eventId: 1, colStart: 8 });
      const record = markerStore.get(1, 8);
      const editorMarker = record.highlightMarkers.get('editor-1');

      markerStore.removeHighlight({ eventId: 1, colStart: 8 });

      expect(editorMarker.destroyed).toBe(true);
      expect(record.baseMarker.isValid()).toBe(true);
      expect(record.trackId).toBeNull();
    });
  });
});
