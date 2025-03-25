'use babel'

import { EventEmitter } from 'events';
const osc = require('osc-min');
import OscServer from "./osc-server";

const oscAddressProperty = 'tidalcycles.oscEval.address';

export default class OscLoader extends EventEmitter {

    constructor(consoleView, tidalRepl, editors) {
        super();
        this.address = atom.config.get(oscAddressProperty);
        this.consoleView = consoleView;
        this.tidalRepl = tidalRepl;
        this.editors = editors;
    }

    init() {
        this.server = new OscServer(this.consoleView);
        this.server.start();

        this.server.sock.on('message', (msg) => {
            let resultMap = osc.fromBuffer(msg);

            if (resultMap.address === this.address) {
                const resultDict = this.asDictionary(resultMap.args)

                if (resultDict['tab'] !== undefined) {
                    atom.workspace.getPanes()[0].setActiveItem(atom.workspace.getTextEditors()[resultDict['tab']])
                }

                if (resultDict['row'] && resultDict['column']) {
                    this.editors.goTo(resultDict['row'] - 1, resultDict['column'])
                }

                this.tidalRepl.eval(resultDict['type'], false);
            }
        });
    }

    asDictionary (oscMap) {
        let dictionary = {}
        for (var i = 0; i < oscMap.length; i+=2) {
            dictionary[oscMap[i].value] = oscMap[i+1].value
        }
        return dictionary
    }

    destroy() {
        try {
            this.server.destroy();
        } catch (e) {
            this.consoleView.logStderr(`OSC server has problems while destroying: \n${e}`);
        }
    }
}
