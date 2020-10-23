'use babel';

import ConsoleView from './console-view';
import Repl from './repl';
import OscLoader from './osc-loader';
import AutocompleteProvider from './autocomplete-provider';
import Ghc from './ghc';
import BootTidal from './boot-tidal';
import SoundBrowser from './sound-browser';

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
      },
      'oscEvalPort': {
        type: 'integer',
        default: 3333,
        description: `OSC port for receiving eval messages.`,
        order: 80
      },
      'oscEvalIp': {
        type: 'string',
        default: '127.0.0.1',
        description: `OSC ip address for receiving eval messages.`,
        order: 81
      },
      'oscEvalAddress': {
        type: 'string',
        default: '/atom/eval',
        description: `OSC address for receiving eval messages. Expected arguments are 'line', 'multi_line' and 'whole_editor'.`,
        order: 82
      },
      'soundBrowserFolders': {
        type: 'array',
        default: [],
        description: 'Folders which must be shown in the sound browser, separed by comma. Restart atom to apply changes',
        order: 90,
        items: {
          type: 'string'
        }
      }
    },

    activate() {
      this.consoleView = new ConsoleView();
      this.consoleView.initUI();
      this.ghc = new Ghc(this.consoleView);
      this.ghc.init();
      this.bootTidal = new BootTidal(this.ghc, atom.project.rootDirectories);
      this.tidalRepl = new Repl(this.consoleView, this.ghc, this.bootTidal);
      this.oscLoader = new OscLoader(this.consoleView, this.tidalRepl);
      this.oscLoader.init();
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
