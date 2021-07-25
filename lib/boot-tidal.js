'use babel'

const path = require('path');
const fs = require('fs');

const bootTidalPathProperty = 'tidalcycles.bootTidalPath'
const defaultBootFileName = 'BootTidal.hs';
const defaultBootFilePath = __dirname + path.sep + defaultBootFileName;

export default class BootTidal {

  constructor(ghc, rootDirectories, consoleView) {
    this.ghc = ghc
    this.rootDirectories = rootDirectories
    this.consoleView = consoleView
  }

  choosePath() {
    this.consoleView.appendLog(`Choose <b>BootTidal.hs</b> path`)
    const configuredBootFilePath = atom.config.get(bootTidalPathProperty);
    if (configuredBootFilePath) {
      this.consoleView.appendLog(`<b> * custom path configured</b>`)
      return configuredBootFilePath
    } else {
      this.consoleView.appendLog(` > no custom path configured`)
    }

    const currentDirectoryPath = this.rootDirectories.length > 0 ?
        this.rootDirectories[0].path + path.sep + defaultBootFileName :
        null;

    if (fs.existsSync(currentDirectoryPath)) {
      this.consoleView.appendLog(`<b> * found in the current directory</b>`)
      return currentDirectoryPath;
    } else {
      this.consoleView.appendLog(` > not found in current directory`)
    }

    try {
      let tidalBootPath = path.join(this.ghc.tidalDataDir(), defaultBootFileName)
      if (fs.existsSync(tidalBootPath)) {
        this.consoleView.appendLog(`<b> * found in the tidal installation folder</b>`)
        return tidalBootPath
      } else {
        this.consoleView.appendLog(` > not found in the tidal installation folder`)
      }
    } catch (err) {
      this.consoleView.appendLog(` > cannot get tidal installation folder ${err.toString().trim()}`)
    }

    this.consoleView.appendLog(`<b> * use the default contained in the plugin</b>`)
    return defaultBootFilePath

  }

  blocks() {
    return fs.readFileSync(this.choosePath(), { encoding: 'utf8'})
      .split('\n\n')
      .map(block => block.replace(":{", "").replace(":}", ""))
      .flatMap(block => block.startsWith(":set")
        ? block.split("\n")
        : [block]
      )
  }

}
