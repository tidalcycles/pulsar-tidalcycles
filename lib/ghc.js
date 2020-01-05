'use babel'

const child_process = require('child_process');
const path = require('path')
const fs = require('fs')
const Ghci = require('./ghci')
const ghciPathProperty = 'tidalcycles.ghciPath'

export default class Ghc {

  constructor(consoleView) {
    this.consoleView = consoleView;
  }

  init() {
    this.folder = this.ghcFolder();
    if (this.folder.startsWith('stack')) {
      this.interactivePath = this.folder + "ghci"
      this.pkgPath = this.folder + "ghc-pkg"
    } else {
      this.interactivePath = path.join(this.folder, "ghci")
      this.pkgPath = path.join(this.folder, "ghc-pkg")
    }
    this.consoleView
      .logStdout(`Ghci command: ${this.interactivePath}\nGhc-pkg command: ${this.pkgPath}`)
  }

  interactive() {
    return new Ghci(
      child_process.spawn(`"${this.interactivePath}"`, [], { shell: true })
    )
  }

  browseTidal(callback) {
    let ghciPath = this.interactivePath;
    child_process.exec(`echo ":browse Sound.Tidal.Context" | "${ghciPath}"`,
      (error, stdout) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        callback(stdout)
    })
  }

  tidalDataDir() {
    try {
      let dataDir = child_process
        .execSync(`"${this.pkgPath}" field tidal data-dir`)
        .toString().trim()

      return dataDir.substring(dataDir.indexOf(' ') + 1)
    } catch (err) {
      console.error(`Error get tidal data-dir: ${err}`)
      return ''
    }

  }

  ghcFolder() {
    let propertyValue = atom.config.get(ghciPathProperty)
    if (propertyValue) {
      this.consoleView.logStdout(`Custom ghci path configured: ${propertyValue}`)
      return propertyValue.endsWith('ghci')
        ? propertyValue.substring(0, propertyValue.length - 4)
        : propertyValue
    } else {
      let ghcupPath = `~/.ghcup/bin/`
      if (fs.existsSync(ghcupPath)) {
        this.consoleView.logStdout(`Choose ghcup default path: ${ghcupPath}`)
        return ghcupPath
      } else {
        this.consoleView.logStdout(`No configured ghc path`)
        return ""
      }
    }
  }

}
