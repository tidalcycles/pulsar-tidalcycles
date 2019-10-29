'use babel'

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const defaultBootFileName = 'BootTidal.hs';
const defaultBootFilePath = __dirname + path.sep + defaultBootFileName;

export default class BootTidal {

  static getPath() {
    let rootDirectories = atom.project.rootDirectories
    return new BootTidal(rootDirectories).choosePath()
  }

  constructor(rootDirectories) {
    this.rootDirectories = rootDirectories
  }

  choosePath() {
    const configuredBootFilePath = atom.config.get('tidalcycles.bootTidalPath');
    if (configuredBootFilePath) return configuredBootFilePath

    const currentDirectoryPath = this.rootDirectories.length > 0 ?
        this.rootDirectories[0].path + path.sep + defaultBootFileName :
        null;

    if (fs.existsSync(currentDirectoryPath)) return currentDirectoryPath;

    let tidalBootPath = this.tidalDataDir() + path.sep + defaultBootFileName
    if (fs.existsSync(tidalBootPath)) {
      return tidalBootPath
    } else {
      return defaultBootFilePath
    }

  }

  tidalDataDir() {
    let dataDir = child_process
      .execSync(`ghc-pkg field tidal data-dir`)
      .toString().trim()

    return dataDir.substring(dataDir.indexOf(' ') + 1)
  }

}
