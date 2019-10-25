'use babel'

const fs = require('fs');

const defaultBootFileName = 'BootTidal.hs';

export default class BootTidal {

  static getPath() {
    let rootDirectories = atom.project.rootDirectories
    return new BootTidal(rootDirectories).load()
  }

  constructor(rootDirectories) {
    this.rootDirectories = rootDirectories
  }

  load() {
    const configuredBootFilePath = atom.config.get('tidalcycles.bootTidalPath');
    if (configuredBootFilePath) return configuredBootFilePath

    const currentDirectoryPath = this.rootDirectories.length > 0 ?
        this.rootDirectories[0].path + '/' + defaultBootFileName :
        null;

    if (fs.existsSync(currentDirectoryPath)) return currentDirectoryPath;

    return  __dirname + '/' + defaultBootFileName;
  }

}
