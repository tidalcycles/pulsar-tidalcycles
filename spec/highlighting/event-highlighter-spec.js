'use babel'

const EventHighlighter = require("../../lib/event-highlighter");
const Tokenizer = require("../../lib/highlighting/tokenizer");
const { MockEditors, makeEditor } = require("../helpers/mocks");

describe('EventHighlighter', () => {
  let consoleView;
  let editors;
  let editor;
  let facade;
  let markerStore;

  beforeEach(() => {
    Tokenizer.reset();
    editor = makeEditor('editor-1', 'buffer-1', ['d1 $ s "superpiano"']);
    editors = new MockEditors();
    editors.setEditor(editor);
    consoleView = { logStdout: () => {}, logStderr: () => {} };

    facade = new EventHighlighter(consoleView, editors);

    markerStore = {
      cleanRowRange: jasmine.createSpy('cleanRowRange'),
      createMarkers: jasmine.createSpy('createMarkers'),
      wipeAll: jasmine.createSpy('wipeAll'),
      applyHighlight: jasmine.createSpy('applyHighlight'),
      removeHighlight: jasmine.createSpy('removeHighlight'),
      cleanUpMarkers: jasmine.createSpy('cleanUpMarkers'),
      get: jasmine.createSpy('get').and.returnValue(undefined),
    };
    facade.markerStore = markerStore;
  });

  afterEach(() => {
    facade.destroy();
  });

  describe('addMetadata', () => {
    it('should clean the row, register markers and return the transformed line', () => {
      const result = facade.addMetadata('d1 $ s "superpiano"', 0);

      expect(markerStore.cleanRowRange).toHaveBeenCalledWith(0, 0);
      expect(markerStore.createMarkers).toHaveBeenCalled();
      expect(result).toEqual('d1 $ s (deltaContext 7 1 "superpiano")');
    });

    it('should pass GHCi commands through without a row', () => {
      expect(facade.addMetadata(':script "test.hs"', undefined)).toEqual(':script "test.hs"');
      expect(markerStore.cleanRowRange).not.toHaveBeenCalled();
      expect(markerStore.createMarkers).not.toHaveBeenCalled();
    });
  });

  describe('onHush', () => {
    it('should wipe all markers and reset the event id counter', () => {
      Tokenizer.lastEventId = 42;

      facade.onHush();

      expect(markerStore.wipeAll).toHaveBeenCalled();
      expect(Tokenizer.lastEventId).toEqual(0);
    });
  });

  describe('styleSubscriber', () => {
    it('should register runtime css blocks', () => {
      facade.styleSubscriber()([{ value: '2' }, { value: 'background-color: #e7b9ed; outline: 2px solid #e7b9ed;' }]);

      expect(facade.styles.hasOscStyle('2')).toBe(true);
    });
  });

  describe('oscPingSubscriber', () => {
    it('should feed the cycle position to the playstate processor', () => {
      const args = [
        { value: '_id_' }, { value: 'clock' }, { value: 'clock' }, { value: 1 },
        { value: 'cps' }, { value: 0.575 }, { value: 'cycle' }, { value: 0.1 },
      ];
      facade.playstateProcessor = {
        setSam: jasmine.createSpy('setSam'),
        handleEvents: jasmine.createSpy('handleEvents'),
      };

      facade.oscPingSubscriber()(args);

      expect(facade.playstateProcessor.setSam).toHaveBeenCalledWith(0.1);
      expect(facade.playstateProcessor.handleEvents).toHaveBeenCalled();
    });

    it('should be a no-op before the ghci session is attached', () => {
      const args = [
        { value: '_id_' }, { value: 'clock' }, { value: 'clock' }, { value: 1 },
        { value: 'cps' }, { value: 0.575 }, { value: 'cycle' }, { value: 0.1 },
      ];

      expect(() => facade.oscPingSubscriber()(args)).not.toThrow();
    });
  });

  describe('attachGhci', () => {
    it('should script playstate.hs and neutralize the prompt', () => {
      const ghci = { writeLine: jasmine.createSpy('writeLine') };
      const playstatePath = require('path').join(__dirname, '..', '..', 'lib', 'tidal', 'playstate.hs');

      facade.attachGhci(ghci);

      expect(ghci.writeLine).toHaveBeenCalledWith(`:{\n:script "${playstatePath}"\n:}`);
      expect(ghci.writeLine).toHaveBeenCalledWith(':set prompt ""');
      expect(ghci.writeLine).toHaveBeenCalledWith(':set prompt-cont ""');
      expect(facade.playstateProcessor).not.toBeNull();
      expect(facade.stdoutCollector).not.toBeNull();
    });
  });

  describe('afterSend', () => {
    it('should reset the playstate and re-arm the clock', () => {
      atom.config.set('tidalcycles.eventHighlighting.fps', 30);
      const ghci = { writeLine: jasmine.createSpy('writeLine') };
      facade.attachGhci(ghci);
      const clockCalls = () => ghci.writeLine.calls
        .allArgs().map(args => args[0])
        .filter(cmd => cmd.startsWith(':{\nclock'));

      ghci.writeLine.calls.reset();
      facade.afterSend();

      expect(clockCalls()).toEqual([':{\nclock "1*30"\n:}']);
      expect(facade.playstateProcessor.currentPlayState).toEqual({});
    });

    it('should be a no-op before the ghci session is attached', () => {
      expect(() => facade.afterSend()).not.toThrow();
    });
  });

  describe('filterStdout', () => {
    it('should route locked blocks to the playstate processor', () => {
      facade.attachGhci({ writeLine: () => {} });

      const log = facade.filterStdout(
        'INIT_PLAYSTATE_START\nd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano\nINIT_PLAYSTATE_END\n'
      );

      expect(log).toEqual('');
      expect(Object.keys(facade.playstateProcessor.currentPlayState).length).toEqual(2);
    });
  });
});
