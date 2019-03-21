'use babel';

import ConsoleView from './console-view';
import Repl from './repl';

export default {
    consoleView: null,
    tidalRepl: null,
    config: {
        'ghciPath': {
            type: 'string',
            default: 'ghci'
        },
        'chaosFilesLocation': {
            type: 'string',
            default: ''
        },
        'chaosFunctionToApply': {
            type: 'string',
            default: ''
        },
        'chaosFunctionXLowBound': {
            type: 'string',
            default: ''
        },
        'chaosFunctionXUpperBound': {
            type: 'string',
            default: ''
        },
        'chaosFunctionRLowBound': {
            type: 'string',
            default: ''
        },
        'chaosFunctionRUpperBound': {
            type: 'string',
            default: ''
        },
        'chaosFunctionRIncrement': {
            type: 'string',
            default: ''
        },
        'useBootFileInCurrentDirectory': {
            type: 'boolean',
            default: false
        },

        'bootTidalPath': {
            type: 'string',
            default: ''
        },
        'useBootFileInCurrentDirectory': {
            type: 'boolean',
            default: false,
            description: 'If a BootTidal.hs file is found at the root of your Atom project, it will be used to boot Tidal.'
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
    }

};
