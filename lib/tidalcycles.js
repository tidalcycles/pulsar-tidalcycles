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
      console.log(this.editor)
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
            this.repl.start();
          } else {
            console.error('Not a .tidal file.');
          }
        },
        'tidalcycles:reboot': () => {
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
        'tidalcycles:toggle-mute': (event) => this.repl.toggleMute(event.originalEvent.key),
        'tidalcycles:toggle-muteall': () => this.repl.toggleMute('all'),
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
