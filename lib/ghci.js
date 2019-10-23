'use babel';

const { exec, spawn } = require('child_process');
const EventEmitter = require('events');
const ghciPathProperty = 'tidalcycles.ghciPath'

export default class Ghci extends EventEmitter {

  static spawn() {
    return new Ghci(
      spawn(atom.config.get(ghciPathProperty), [], { shell: true })
    )
  }

  static exec(command, callback) {
    let ghciPath = atom.config.get(ghciPathProperty)
    exec(`echo "${command}" | ${ghciPath}`, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }

      callback(stdout)
    })
  }

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

  write(command) {
    this.process.stdin.write(command);
  }

  destroy() {
    this.process.kill();
  }

}
