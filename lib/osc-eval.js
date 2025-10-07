'use babel'

import Repl from './repl';
import {Editors} from './editors';
import OscServer from './osc-server';

export function oscEvalSubscriber(tidalRepl: Repl, editors: Editors) {
  return (args: {}): void => {
    const message = OscServer.asDictionary(args);

    if (message['tab'] !== undefined) {
      atom.workspace.getPanes()[0].setActiveItem(atom.workspace.getTextEditors()[message['tab']])
    }

    if (message['row'] && message['column']) {
      editors.goTo(message['row'] - 1, message['column'])
    }

    if (message['type']) {
      tidalRepl.eval(message['type'], false);
    }
  }
}
