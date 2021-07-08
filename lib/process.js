'use babel';

const EventEmitter = require('events');
const child_process = require('child_process');
const path = require('path');

export default class Process extends EventEmitter {

  static ghci(path) {
    return new Process(child_process.spawn(path, [], { shell: true }))
  }

  static tidalListener() {
    return new Process(child_process.spawn('tidal-listener', []))
  }

  static superDirt(filePath) {
    return new Process(child_process.spawn('sclang', [filePath]))
  }

  constructor(process) {
    super()
    this.stdOut = [];
    this.stdErr = [];

    this.process = process

    this.process.stderr.on('data', data => {
      this.stdErr.push(data.toString('utf8'))
      setTimeout(() => {
        if (this.stdErr.length) {
          let err = this.stdErr.join('')
          this.stdErr.length = 0;
          this.emit('stderr', err);
        }
      }, 50)
    });

    this.process.stdout.on('data', data => {
      this.stdOut.push(data.toString('utf8'))
      setTimeout(() => {
        if (this.stdOut.length) {
          let out = this.stdOut.join('')
          this.stdOut.length = 0
          this.emit('stdout', out);
        }
      }, 50)
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
