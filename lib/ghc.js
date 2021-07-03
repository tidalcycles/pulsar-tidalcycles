'use babel'

const child_process = require('child_process');
const path = require('path')
const fs = require('fs')
const os = require('os')
const Process = require('./process')

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
    return new Process(
      child_process.spawn(this.wrappedInteractivePath(), [], { shell: true })
    )
  }

  browseTidal(callback) {
    child_process.exec(`echo ":browse Sound.Tidal.Context" | ${this.wrappedInteractivePath()}`,
      (error, stdout) => {
        if (error) {
          this.consoleView.logStderr(`Cannot browse tidal to obtain informations for autocomplete: ${error}`)
        } else {
          callback(stdout)
        }

      })
  }

  pkg(arguments) {
    let command = ((interpreter => {
      switch(interpreter) {
        case 'stack': return `${stackPrefix} ghc-pkg ${arguments}`
        case 'nix': return `${nixPrefix} "ghc-pkg ${arguments}"`
        default: return `"${this.pkgPath}" ${arguments}`
      }
    }))(atom.config.get(interpreterProperty));

    return child_process
      .execSync(command)
      .toString().trim()
  }

  tidalDataDir() {
    let dataDir = this.pkg('field tidal data-dir').trim()

    return dataDir.substring(dataDir.indexOf(' ') + 1)
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
        this.consoleView.logStdout(`Using default GHC system path definition`)
        return ""
      }
    }
  }

  wrappedInteractivePath() {
    return atom.config.get(interpreterProperty) === 'default'
      ? `"${this.interactivePath}"`
      : `${this.interactivePath}`
  }

}
