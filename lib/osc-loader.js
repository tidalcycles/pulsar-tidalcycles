'use babel'

import { EventEmitter } from 'events';
const osc = require('osc-min');
import OscServer from "./osc-server";

const oscAddressProperty = 'tidalcycles.oscEvalAddress';

export default class OscLoader extends EventEmitter {

    constructor(consoleView, tidalRepl, editor) {
        super();
        this.address = atom.config.get(oscAddressProperty);
        this.consoleView = consoleView;
        this.tidalRepl = tidalRepl;
        this.editor = editor;
    }

    init() {
        this.server = new OscServer(this.consoleView);
        this.server.start();

        this.server.sock.on('message', (msg) => {
            let resultMap = osc.fromBuffer(msg);

            if (resultMap.address === this.address) {
                let arguments = this.asDictionary(resultMap.args)

                if (arguments['row'] && arguments['column']) {
                    this.editor.goTo(arguments['row'] - 1, arguments['column'])
                }

                this.tidalRepl.eval(arguments['type'], false);
            }
        });
    }

    asDictionary (arguments) {
        let dictionary = {}
        for (var i = 0; i < arguments.length; i+=2) {
            dictionary[arguments[i].value] = arguments[i+1].value
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
