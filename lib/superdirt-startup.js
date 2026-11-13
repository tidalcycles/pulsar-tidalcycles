'use babel'

const path = require('path');
const fs = require('fs');

const defaultFileName = 'superdirt_startup.scd';
const defaultFilePath = __dirname + path.sep + defaultFileName;

export default class SuperDirtStartup {

  constructor() {
    this.rootDirectories = atom.project.rootDirectories
  }

  choosePath() {
    const currentDirectoryPath = this.rootDirectories.length > 0 ?
        this.rootDirectories[0].path + path.sep + defaultFileName :
        null;

    if (fs.existsSync(currentDirectoryPath)) return currentDirectoryPath;

    return defaultFilePath
  }

}
