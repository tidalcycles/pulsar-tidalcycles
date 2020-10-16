'use babel'

import { EventEmitter } from 'events';
const osc = require('osc-min');

import OscServer from "./osc-server";

const oscAddressProperty = 'tidalcycles.oscEvalAddress';

export default class OscLoader extends EventEmitter {

    consoleView = null;
    tidalRepl = null;

    constructor(consoleView, tidalRepl) {
        super();
        this.address = atom.config.get(oscAddressProperty);
        this.consoleView = consoleView;
        this.tidalRepl = tidalRepl;
    }

    init() {
        this.server = new OscServer(this.consoleView);
        this.server.start();

        this.server.sock.on('message', (msg) => {
            let resultMap = osc.fromBuffer(msg);

            if (resultMap.address === this.address) {
                this.tidalRepl.eval(resultMap.args[0].value, false);
            }
        });
    }

    destroy() {
        try {
            this.server.destroy();
        } catch (e) {
            this.consoleView.logStderr(`OSC server has problems while destroying: \n${e}`);
        }
    }
}
