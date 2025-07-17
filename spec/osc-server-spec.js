const OscServer = require('../lib/osc-server')
const osc = require('osc-min')
const dgram = require('dgram');

describe('OscServer', () => {

    const port = 36111;
    let oscServer = new OscServer({}, "127.0.0.1", port);

    beforeEach((done) => {
        oscServer.start().finally(() => done());
    })

    afterEach(() => {
        oscServer.stop();
    })

    it('should start an osc server and receive a message', done => {
        let listener = (message) => {
            if (message['key'] === 'value') {
                done();
            } else {
                done("failure");
            }
        }

        oscServer.register('/address', listener);

        const message = osc.toBuffer({ address: "/address", args: ["key", "value"] });
        dgram.createSocket('udp4').send(message, 0, message.byteLength, port, "127.0.0.1")
    })

})
