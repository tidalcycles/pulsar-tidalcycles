'use babel'

const dgram = require('dgram');
const osc = require('osc-min');

export default class OscServer {

  port = null;
  ip = null;
  sock = null;
  consoleView = null;
  subscribers: Map<string, Function> = new Map();
  transformers: Map<string, Function> = new Map();

  constructor(consoleView, ip, port) {
    this.ip = ip;
    this.port = port;
    this.consoleView = consoleView;
    this.sock = dgram.createSocket('udp4');
  }

  start(): Promise<void> {
    let promise = new Promise((resolve, reject) => {
      this.sock.on('listening', () => {
        resolve()
      });

      this.sock.on('error', (err) => {
        reject(err);
      });
    });

    this.sock.bind(this.port, this.ip);

    this.sock.on('message', (message) => {
      let oscMessage = osc.fromBuffer(message);

      if (oscMessage.oscType === "bundle") {
        oscMessage.elements.forEach(element => {
          element.time = OscServer.fromNTPTime(oscMessage.timetag);
          this.handleOscMessage(element.address, element.args, element.time);
        });
      } else {
        this.handleOscMessage(oscMessage.address, oscMessage.args);
      }
    });

    return promise
      .then(() => {
        this.consoleView.logStdout(`Listening for external osc messages on ${this.ip}:${this.port}`)
      })
      .catch(err => {
        this.consoleView.logStderr(`OSC server error: \n${err.stack}`)
        this.sock.close();
      });
  }

  handleOscMessage(address, args, time) {
    let subscriber = this.subscribers.get(address);

    if (subscriber) {
      subscriber(args, time);
    } else {
      this.consoleView.logStderr(`Received OSC message on unsupported ${address} address`);
    }
  }

  stop() {
    if (this.sock) {
      this.sock.close();
    }
  }

  destroy() {
    this.stop();
  }

  register(address: string, listener: Function) {
    this.subscribers.set(address, listener)
  }

  static fromNTPTime([seconds, fractional]) {
    return (
      (seconds - 2208988800 + fractional / 4294967295) * // NTP Epoch to Unix Seconds
      1000 - // In milliseconds
      performance.timeOrigin // Offset by timeOrigin
    );
  }

  static asDictionary(oscMap): {} {
    let dictionary = {}
    for (let i = 0; i < oscMap.length; i += 2) {
      dictionary[oscMap[i].value] = oscMap[i + 1].value
    }
    return dictionary
  }

}
