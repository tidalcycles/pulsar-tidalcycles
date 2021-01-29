'use babel';

import ConsoleView from './console-view';
import Repl from './repl';
import OscLoader from './osc-loader';
import AutocompleteProvider from './autocomplete-provider';
import Ghc from './ghc';
import BootTidal from './boot-tidal';
import SoundBrowser from './sound-browser';
const Status = require('./status')
const { LINE, MULTI_LINE, WHOLE_EDITOR, Editor } = require('./editor')
const config = require('./config')

export default {
    consoleView: null,
    repl: null,
    config: config,
    status: new Status(),
    editor: new Editor(),

    activate() {
      this.consoleView = new ConsoleView(this.status);
      this.consoleView.initUI();
      this.ghc = new Ghc(this.consoleView);
      this.ghc.init();
      this.bootTidal = new BootTidal(this.ghc, atom.project.rootDirectories);
      this.repl = new Repl(this.consoleView, this.ghc, this.bootTidal, this.status, this.editor);

      if (atom.config.get('tidalcycles.oscEvalEnable')) {
        this.oscLoader = new OscLoader(this.consoleView, this.repl, this.editor);
        this.oscLoader.init();
      }

      this.soundBrowser = new SoundBrowser();
      this.soundBrowser.init(atom.config.get('tidalcycles.soundBrowserFolders'));

      atom.commands.add('atom-workspace', {
        'tidalcycles:boot': () => {
          if (this.editor.isTidal()) {
            this.consoleView.logStdout('Start atom-tidalcycles plugin')
            this.repl.start();
          } else {
            atom.notifications.addError('Cannot start Tidal from a non ".tidal" file')
          }
        },
        'tidalcycles:reboot': () => {
          this.consoleView.logStdout('Reboot atom-tidalcycles plugin')
          this.repl.destroy();
          this.repl.start();
        }
      });

      atom.commands.add('atom-text-editor', {
        'tidalcycles:eval': () => this.repl.eval(LINE, false),
        'tidalcycles:eval-multi-line': () => this.repl.eval(MULTI_LINE, false),
        'tidalcycles:eval-whole-editor': () => this.repl.eval(WHOLE_EDITOR, false),
        'tidalcycles:eval-copy': () => this.repl.eval(LINE, true),
        'tidalcycles:eval-multi-line-copy': () => this.repl.eval(MULTI_LINE, true),
        'tidalcycles:toggle-muteall': () => this.repl.toggleMute('all'),
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
    },

    deactivate() {
      this.consoleView.destroy();
      this.repl.destroy();
      this.oscLoader.destroy();
      this.soundBrowser.destroy();
    },

    serialize() {
      return {
        consoleViewState: this.consoleView.serialize()
      };
    },

    autocompleteProvider() {
      return new AutocompleteProvider(this.ghc)
    }

};
