'use babel'

const path = require('path')
const fs = require('fs')
const os = require('os')
const Process = require('./process')

const child_process = require('child_process');
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
        this.consoleView.flushLog()
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
    return Process.ghci(this.wrappedInteractivePath());
  }

  browseTidal(callback) {
    const os = require('os');
    const commands = ':browse Sound.Tidal.Context\n:browse Sound.Tidal.Boot\n';
    const tempFile = path.join(os.tmpdir(), 'tidal-browse-commands.txt');

    fs.writeFileSync(tempFile, commands);

    child_process.exec(`${this.wrappedInteractivePath()} < "${tempFile}"`,
      (error, stdout) => {
        fs.unlinkSync(tempFile);
        if (error) {
          this.consoleView.logStderr(`Cannot browse tidal to obtain informations for autocomplete: ${error}`)
        } else {
          callback(stdout)
        }
      })
  }

  pkg(args) {
    let command = ((interpreter => {
      switch(interpreter) {
        case 'stack': return `${stackPrefix} ghc-pkg ${args}`
        case 'nix': return `${nixPrefix} "ghc-pkg ${args}"`
        default: return `"${this.pkgPath}" ${args}`
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
    this.consoleView.appendLog(`Choose <b>ghc</b> base path`)
    if (propertyValue) {
      this.consoleView.appendLog(`<b> * custom path configured</b>`)
      let resolvedPropertyValue = propertyValue.replace('~', os.homedir())
      return resolvedPropertyValue.endsWith('ghci')
        ? resolvedPropertyValue.substring(0, resolvedPropertyValue.length - 4)
        : resolvedPropertyValue
    } else {
      this.consoleView.appendLog(` > no custom path configured`)
      let ghcupPath = path.join(os.homedir(), ".ghcup", "bin")
      if (fs.existsSync(ghcupPath)) {
        this.consoleView.appendLog(`<b> * use ghcup default path</b>`)
        return ghcupPath
      } else {
        this.consoleView.appendLog(` > ghcup not found`)
        this.consoleView.appendLog(`<b> * using default GHC system path definition</b>`)
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
