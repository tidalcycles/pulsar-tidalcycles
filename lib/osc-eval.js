'use babel'

import Repl from './repl';
import {Editors} from './editors';

export function oscEvalSubscriber(tidalRepl: Repl, editors: Editors) {
    return (message: {}): void => {
        if (message['tab'] !== undefined) {
            atom.workspace.getPanes()[0].setActiveItem(atom.workspace.getTextEditors()[message['tab']])
        }

        if (message['row'] && message['column']) {
            editors.goTo(message['row'] - 1, message['column'])
        }

        tidalRepl.eval(message['type'], false);
    }
}
