const OscServer = require('../lib/osc-server')
const osc = require('osc-min')
const dgram = require('dgram');

describe('OscServer', () => {

    const consoleView = { logStdout: () => {}, logStderr: () => {} }
    let oscServer;
    let client;
    const port = 36111;

    beforeEach((done) => {
        oscServer = new OscServer(consoleView, "127.0.0.1", port);
        oscServer.start().finally(done);
    })

    afterEach(() => {
        if (client) {
            client.close();
            client = null;
        }
        oscServer.stop();
    })

    const send = (message) => {
        client = dgram.createSocket('udp4');
        // Without an 'error' listener an ICMP "port unreachable" (raised when the
        // server socket is torn down between specs) becomes an uncaught exception
        // that aborts the Electron renderer (exit code 134).
        client.on('error', () => {});
        client.send(message, 0, message.byteLength, port, "127.0.0.1");
    }

    it('should start an osc server and receive a message', done => {
        let listener = (message) => {
            if (message) {
                const args = OscServer.asDictionary(message);
                expect(args.key).toBe("value");
                done();
            } else {
                done.fail("Received message is empty");
            }
        }

        oscServer.register('/address', listener);

        send(osc.toBuffer({ address: "/address", args: ["key", "value"] }));
    })

    it('should start an osc server and receive a message of type bundle', done => {
        let messages = [];
        const expected = [{key1: 'value1'}, {key2: 'value2'}]

        let listener = (message) => {
            messages.push(OscServer.asDictionary(message));
            if (messages.length === expected.length) {
                expect(messages).toEqual(expected);
                done();
            }
        }

        oscServer.register('/address', listener);

        send(osc.toBuffer({
            elements: [
                {
                    address: "/address",
                    args: ["key1", "value1"]
                },
                {
                    address: "/address",
                    args: ["key2", "value2"]
                }
            ],
            oscType: 'bundle'
        }));
    })
})
