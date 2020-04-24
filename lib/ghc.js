'use babel'

const child_process = require('child_process');
const path = require('path')
const fs = require('fs')
const os = require('os')
const Ghci = require('./ghci')

const ghciPathProperty = 'tidalcycles.ghciPath'
const interpreterProperty = 'tidalcycles.interpreter'

const stackPrefix = 'stack exec --package tidal'
const nixPrefix = 'nix-shell -p "haskellPackages.ghcWithPackages (pkgs: [pkgs.tidal])" --run'

export default class Ghc {

  constructor(consoleView) {
    this.consoleView = consoleView;
  }

  init() {
    switch (atom.config.get(interpreterProperty)) {
      case 'stack':
        this.interactivePath = `${stackPrefix} ghci`
        this.pkgPath = `${stackPrefix} ghc-pkg`
        break;
      case 'nix':
        this.interactivePath = `${nixPrefix} ghci`
        this.pkgPath = `${nixPrefix} "ghc-pkg"`
        break;
      default:
        let basePath = this.ghcBasePath();
        if (basePath.startsWith('stack') || basePath.startsWith('nix-shell')) {
          this.interactivePath = basePath + "ghci"
          this.pkgPath = basePath + "ghc-pkg"
        } else {
          this.interactivePath = path.join(basePath, "ghci")
          this.pkgPath = path.join(basePath, "ghc-pkg")
        }
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
    let browseTidalCommand = atom.config.get(interpreterProperty) === 'default'
      ? `echo ":browse Sound.Tidal.Context" | "${this.interactivePath}"`
      : `echo ":browse Sound.Tidal.Context" | ${this.interactivePath}`

    child_process.exec(browseTidalCommand, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      callback(stdout)
    })
  }

  tidalDataDir() {
    try {
      let command = ((interpreter => {
        switch(interpreter) {
          case 'stack': return `${stackPrefix} ghc-pkg field tidal data-dir`
          case 'nix': return `${nixPrefix} "ghc-pkg field tidal data-dir"`
          default: return `"${this.pkgPath}" field tidal data-dir`
        }
      }))(atom.config.get(interpreterProperty));

      let dataDir = child_process
        .execSync(command)
        .toString().trim()

      return dataDir.substring(dataDir.indexOf(' ') + 1)
    } catch (err) {
      console.error(`Error get tidal data-dir: ${err}`)
      return ''
    }

  }

  ghcBasePath() {
    let propertyValue = atom.config.get(ghciPathProperty)
    if (propertyValue) {
      this.consoleView.logStdout(`Custom ghci path configured: ${propertyValue}`)
      let resolvedPropertyValue = propertyValue.replace('~', os.homedir())
      return resolvedPropertyValue.endsWith('ghci')
        ? resolvedPropertyValue.substring(0, resolvedPropertyValue.length - 4)
        : resolvedPropertyValue
    } else {
      let ghcupPath = path.join(os.homedir(), ".ghcup", "bin")
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
