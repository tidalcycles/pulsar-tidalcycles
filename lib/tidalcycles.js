'use babel';

import ConsoleView from './console-view';
import Repl from './repl';
import AutocompleteProvider from './autocomplete-provider';

export default {
    consoleView: null,
    tidalRepl: null,
    config: {
        'ghciPath': {
            type: 'string',
            default: 'ghci'
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
        'consoleMaxHeight': {
            type: 'integer',
            default: 100,
            description: 'The console maximum height in pixels.'
        },
        'autocomplete': {
          type: 'boolean',
          default: true,
          description: 'Autocomplete code'
        }
    },

    activate(state) {
        this.consoleView = new ConsoleView(state.consoleViewState);
        this.tidalRepl = new Repl(this.consoleView);
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
      return new AutocompleteProvider()
    }

};
