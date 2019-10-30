'use babel';

const EventEmitter = require('events');

export default class Ghci extends EventEmitter {

  constructor(process) {
    super()
    this.process = process

    this.process.stderr.on('data', data => {
      this.emit('stderr', data)
    });
    this.process.stdout.on('data', data => {
      this.emit('stdout', data)
    });
  }

  writeLine(command) {
    this.process.stdin.write(command);
    this.process.stdin.write('\n');
  }

  destroy() {
    this.process.kill();
  }

}
