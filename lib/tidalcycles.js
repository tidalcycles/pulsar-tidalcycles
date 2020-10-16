'use babel';

import ConsoleView from './console-view';
import Repl from './repl';
import AutocompleteProvider from './autocomplete-provider';
import Ghc from './ghc';
import BootTidal from './boot-tidal';

export default {
    consoleView: null,
    tidalRepl: null,
    config: {
      'interpreter': {
        type: 'string',
        default: 'default',
        enum: [
          { value: 'default', description: 'Default (ghc installed through cabal)'},
          { value: 'stack', description: 'Stack'},
          { value: 'nix', description: 'Nix'}
        ],
        order: 0
      },
      'ghciPath': {
        type: 'string',
        default: '',
        description: 'Haskell (ghci) path, needed only for the "Default" interpreter',
        order: 10
      },
      'bootTidalPath': {
        type: 'string',
        default: '',
        order: 20
      },
      'autocomplete': {
        type: 'boolean',
        default: true,
        description: 'Autocomplete code',
        order: 30
      },
      'hooglePath': {
        type: 'string',
        default: 'hoogle',
        description: 'Path of hoogle command, needed for documentation on autocomplete',
        order: 40
      },
      'consolePrompt': {
        type: 'string',
        default: 't',
        description: `Console prompt. Look at the docs for available placeholders`,
        order: 50
      },
      'showErrorNotifications': {
        type: 'boolean',
        default: true,
        description: 'Show atom notifications on error.',
        order: 55
      },
      'onlyShowLogWhenErrors': {
        type: 'boolean',
        default: false,
        description: 'Only show console if last message was an error.',
        order: 60
      },
      'onlyLogLastMessage': {
        type: 'boolean',
        default: false,
        description: 'Only log last message to the console.',
        order: 70
      }
    },

    activate() {
      this.consoleView = new ConsoleView();
      this.consoleView.initUI();
      this.ghc = new Ghc(this.consoleView);
      this.ghc.init();
      this.bootTidal = new BootTidal(this.ghc, atom.project.rootDirectories);
      this.tidalRepl = new Repl(this.consoleView, this.ghc, this.bootTidal);
    },

    deactivate() {
        this.consoleView.destroy();
        this.tidalRepl.destroy();
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
