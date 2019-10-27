'use babel'

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const defaultBootFileName = 'BootTidal.hs';
const platformResolvers = {
  linux: () => child_process.execSync(`ghc-pkg describe $(ghc-pkg latest tidal) | grep data-dir | cut -f2 -d' '`)
    .toString().trim()
}

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

    let platformPathResolver = platformResolvers[process.platform]
    if (platformPathResolver !== undefined) {
      return platformPathResolver() + path.sep + defaultBootFileName
    } else {
      return  __dirname + path.sep + defaultBootFileName;
    }
  }

}
