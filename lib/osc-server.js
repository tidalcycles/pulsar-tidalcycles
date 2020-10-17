'use babel'

const dgram = require('dgram');
const oscPortProperty = 'tidalcycles.oscEvalPort';
const oscIpProperty = 'tidalcycles.oscEvalIp';

export default class OscServer {

    port = null;
    ip = null;
    sock = null;
    consoleView = null;

    constructor(consoleView) {
        this.port =  atom.config.get(oscPortProperty);
        this.ip =  atom.config.get(oscIpProperty);
        this.consoleView = consoleView;
        this.sock = dgram.createSocket('udp4');
    }

    start() {
        this.sock.on('error', (err) => {
           this.consoleView.logStderr(`OSC server error: \n${err.stack}`)
           this.sock.close();
        });

        this.sock.on('listening', () => {
            this.consoleView.logStdout(`Listening for external osc messages on ${this.ip}:${this.port}`)
        });

        this.sock.bind(this.port, this.ip);
    }

    stop() {
        if (this.sock) {
            this.sock.close();
        }
    }

    destroy() {
        this.stop();
    }
}
