const OscServer = require('../lib/osc-server')
const osc = require('osc-min')
const dgram = require('dgram');

describe('OscServer', () => {

  let oscServer;
  const port = 36111;

  beforeEach((done) => {
    oscServer = new OscServer({}, "127.0.0.1", port);
    oscServer.start().finally(done);
  })

  afterEach(() => {
    oscServer.stop();
  })

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

    const message = osc.toBuffer({ address: "/address", args: ["key", "value"] });
    dgram.createSocket('udp4').send(message, 0, message.byteLength, port, "127.0.0.1")
  })

  it('should start an osc server and receive a message of type bundle', done => {

    let messages = [];

    const ntpTime = [3944678400, 0];

    const expectedTime = OscServer.fromNTPTime(ntpTime);

    const expected =
      [
        { key1: 'value1', time: expectedTime },
        { key2: 'value2', time: expectedTime }
      ]

    let listener = (message, time) => {
      const args = OscServer.asDictionary(message);
      args.time = time;
      messages.push(args);
      if (messages.length === expected.length) {
        expect(messages).toEqual(expected);
        done();
      }
    }

    oscServer.register('/address', listener);

    const message = osc.toBuffer({
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
      timetag: ntpTime,
      oscType: 'bundle'
    });
    dgram.createSocket('udp4').send(message, 0, message.byteLength, port, "127.0.0.1")

  })
})
