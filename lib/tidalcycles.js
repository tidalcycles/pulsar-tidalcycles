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
        'ghciPath': {
            type: 'string',
            default: '',
            description: 'Haskell (ghci) path'
        },
        'bootTidalPath': {
            type: 'string',
            default: ''
        },
        'onlyShowLogWhenErrors': {
            type: 'boolean',
            default: false,
            description: 'Only show console if last message was an error.'
        },
        'onlyLogLastMessage': {
            type: 'boolean',
            default: false,
            description: 'Only log last message to the console.'
        },
        'filterPromptFromLogMessages': {
            type: 'boolean',
            default: true,
            description: 'Whether to filter out those long prompt comming from ghci.'
        },
        'autocomplete': {
          type: 'boolean',
          default: true,
          description: 'Autocomplete code'
        },
        'hooglePath': {
          type: 'string',
          default: 'hoogle',
          description: 'Path of hoogle command, needed for documentation on autocomplete'
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
