'use babel';

import ConsoleView from './console-view';
import Repl from './repl';
import TidalListenerRepl from './tidal-listener-repl';
import {oscEvalSubscriber} from './osc-eval';
import AutocompleteProvider from './autocomplete-provider';
import Ghc from './ghc';
import BootTidal from './boot-tidal';
import SoundBrowser from './sound-browser';
import EventHighlighter from "./event-highlighter";
import OscServer from "./osc-server";
const Status = require('./status')
const SuperDirt = require('./superdirt')
const { LINE, MULTI_LINE, WHOLE_EDITOR, Editors } = require('./editors')
const config = require('./config')

export default {
    consoleView: null,
    repl: null,
    eventHighlighter: null,
    config: config,
    status: new Status(),
    editors: new Editors(),
    superDirt: new SuperDirt(),
    oscServers: [],

    activate() {
      if (atom.config.get('tidalcycles.superDirt.autostart')) {
        this.superDirt.start();
      }

      this.consoleView = new ConsoleView(this.status);
      this.consoleView.initUI();

      if (atom.config.get('tidalcycles.interpreter') === 'listener') {
        this.repl = new TidalListenerRepl(this.consoleView, this.status, this.editors);
      } else {
        this.ghc = new Ghc(this.consoleView);
        this.ghc.init();

        const oscEventHighligthingServer = new OscServer(this.consoleView, atom.config.get('tidalcycles.eventHighlighting.ip'), atom.config.get('tidalcycles.eventHighlighting.port'));
        this.eventHighlighter = new EventHighlighter(this.consoleView, this.editors);
        this.eventHighlighter.init();
        oscEventHighligthingServer.register("/editor/highlights",
          this.eventHighlighter.oscHighlightSubscriber(),
          this.eventHighlighter.highlightTransformer
        );
        this.oscServers.push(oscEventHighligthingServer);

        this.bootTidal = new BootTidal(this.ghc, atom.project.rootDirectories, this.consoleView);
        this.repl = new Repl(this.consoleView, this.ghc, this.bootTidal, this.status, this.editors, this.eventHighlighter);
      }

      if (atom.config.get('tidalcycles.oscEval.enable')) {
        const oscEvalServer = new OscServer(this.consoleView, atom.config.get('tidalcycles.oscEval.ip'), atom.config.get('tidalcycles.oscEval.port'));
        oscEvalServer.register(atom.config.get('tidalcycles.oscEval.address'), oscEvalSubscriber(this.repl, this.editors));
        this.oscServers.push(oscEvalServer);
      }

      this.soundBrowser = new SoundBrowser();
      this.soundBrowser.init(atom.config.get('tidalcycles.soundBrowser.folders'));

      this.oscServers.forEach(server => server.start());

      atom.commands.add('atom-workspace', {
        'tidalcycles:boot': () => {
          if (this.editors.currentIsTidal()) {
            this.consoleView.logStdout('Start TidalCycles plugin')
            this.repl.start();
          } else {
            atom.notifications.addError('Cannot start Tidal from a non ".tidal" file')
          }
        },
        'tidalcycles:reboot': () => {
          this.consoleView.logStdout('Reboot TidalCycles plugin')
          this.repl.destroy();
          this.repl.start();
        },
        'tidalcycles:boot-superdirt': () => {
          this.consoleView.logStdout('Boot SuperDirt')
          this.superDirt.destroy();
          this.superDirt.start();
        }
      });

      atom.commands.add('atom-text-editor', {
        'tidalcycles:eval': () => this.repl.eval(LINE, false),
        'tidalcycles:eval-multi-line': () => this.repl.eval(MULTI_LINE, false),
        'tidalcycles:eval-whole-editor': () => this.repl.eval(WHOLE_EDITOR, false),
        'tidalcycles:eval-copy': () => this.repl.eval(LINE, true),
        'tidalcycles:eval-multi-line-copy': () => this.repl.eval(MULTI_LINE, true),
        'tidalcycles:unmuteAll': () => this.repl.unmuteAll(),
        'tidalcycles:toggle-mute-1': () => this.repl.toggleMute('1'),
        'tidalcycles:toggle-mute-2': () => this.repl.toggleMute('2'),
        'tidalcycles:toggle-mute-3': () => this.repl.toggleMute('3'),
        'tidalcycles:toggle-mute-4': () => this.repl.toggleMute('4'),
        'tidalcycles:toggle-mute-5': () => this.repl.toggleMute('5'),
        'tidalcycles:toggle-mute-6': () => this.repl.toggleMute('6'),
        'tidalcycles:toggle-mute-7': () => this.repl.toggleMute('7'),
        'tidalcycles:toggle-mute-8': () => this.repl.toggleMute('8'),
        'tidalcycles:toggle-mute-9': () => this.repl.toggleMute('9'),
        'tidalcycles:toggle-mute-10': () => this.repl.toggleMute('10'),
        'tidalcycles:toggle-mute-11': () => this.repl.toggleMute('11'),
        'tidalcycles:toggle-mute-12': () => this.repl.toggleMute('12'),
        'tidalcycles:toggle-mute-13': () => this.repl.toggleMute('13'),
        'tidalcycles:toggle-mute-14': () => this.repl.toggleMute('14'),
        'tidalcycles:toggle-mute-15': () => this.repl.toggleMute('15'),
        'tidalcycles:toggle-mute-16': () => this.repl.toggleMute('16'),
        'tidalcycles:hush': () => this.repl.hush()
      });

      atom.workspace.onWillDestroyPaneItem(event => {
        if (event.item.getURI() === 'atom://tidalcycles/superdirt-console') {
          this.superDirt.destroy();
        }
      })
    },

    deactivate() {
      this.consoleView.destroy();
      this.superDirt.destroy();
      this.repl.destroy();
      this.soundBrowser.destroy();
      this.oscServers.forEach(server => server.destroy());
      this.oscServers = [];
    },

    serialize() {
      return {
        consoleViewState: this.consoleView.serialize(),
        superdirtConsoleState: this.superDirt.serialize()
      };
    },

    autocompleteProvider() {
      if (this.ghc) {
        return new AutocompleteProvider(this.ghc)
      } else {
        return undefined
      }

    }

};
