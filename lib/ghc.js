'use babel'

const child_process = require('child_process');
const path = require('path')
const fs = require('fs')
const Ghci = require('./ghci')
const ghciPathProperty = 'tidalcycles.ghciPath'

export default class Ghc {

  static interactive() {
    return new Ghci(
      child_process.spawn(Ghc.commandPath('ghci'), [], { shell: true })
    )
  }

  static browseTidal(callback) {
    let ghciPath = Ghc.commandPath('ghci')
    child_process.exec(`echo ":browse Sound.Tidal.Context" | ${ghciPath}`,
      (error, stdout) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        callback(stdout)
    })
  }

  static commandPath(name) {
    let propertyValue = Ghc.ghciPathProperty()
    if (propertyValue) {
      return propertyValue.endsWith('ghci')
        ? propertyValue.substring(0, propertyValue.length - 4) + name
        : path.join(propertyValue, name)
    } else {
      let ghcupPath = `~/.ghcup/bin/${name}`
      return fs.existsSync(ghcupPath) ? ghcupPath : name
    }
  }

  static tidalDataDir() {
    try {
      let dataDir = child_process
        .execSync(`${Ghc.commandPath('ghc-pkg')} field tidal data-dir`)
        .toString().trim()

      return dataDir.substring(dataDir.indexOf(' ') + 1)
    } catch (err) {
      console.error(`Error get tidal data-dir: ${err}`)
      return ''
    }

  }

  static ghciPathProperty() {
    return atom.config.get(ghciPathProperty)
  }

}
