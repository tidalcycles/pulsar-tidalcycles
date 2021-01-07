'use babel';

import ConsoleView from './console-view';
import Repl from './repl';
import OscLoader from './osc-loader';
import AutocompleteProvider from './autocomplete-provider';
import Ghc from './ghc';
import BootTidal from './boot-tidal';
import SoundBrowser from './sound-browser';
const Status = require('./status')
const config = require('./config')

export default {
    consoleView: null,
    tidalRepl: null,
    config: config,
    status: new Status(),

    activate() {
      this.consoleView = new ConsoleView(this.status);
      this.consoleView.initUI();
      this.ghc = new Ghc(this.consoleView);
      this.ghc.init();
      this.bootTidal = new BootTidal(this.ghc, atom.project.rootDirectories);
      this.tidalRepl = new Repl(this.consoleView, this.ghc, this.bootTidal, this.status);

      if (atom.config.get('tidalcycles.oscEvalEnable')) {
        this.oscLoader = new OscLoader(this.consoleView, this.tidalRepl);
        this.oscLoader.init();
      }

      this.soundBrowser = new SoundBrowser();
      this.soundBrowser.init(atom.config.get('tidalcycles.soundBrowserFolders'));
    },

    deactivate() {
      this.consoleView.destroy();
      this.tidalRepl.destroy();
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
