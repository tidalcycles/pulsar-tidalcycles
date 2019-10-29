'use babel';

const { exec, spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');
const ghciPathProperty = 'tidalcycles.ghciPath'

export default class Ghci extends EventEmitter {

  static spawn() {
    return new Ghci(
      spawn(Ghci.commandPath('ghci'), [], { shell: true })
    )
  }

  static commandPath(name) {
    let propertyValue = Ghci.ghciPathProperty()
    if (propertyValue) {
      return path.basename(propertyValue) === 'ghci'
        ? path.join(path.parse(propertyValue).dir, name)
        : path.join(propertyValue, name)
    } else {
      return name
    }
  }

  static ghciPathProperty() {
    return atom.config.get(ghciPathProperty)
  }

  static exec(command, callback) {
    let ghciPath = Ghci.commandPath('ghci')
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

  writeLine(command) {
    this.process.stdin.write(command);
    this.process.stdin.write('\n');
  }

  destroy() {
    this.process.kill();
  }

}
