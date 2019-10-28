'use babel'

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const defaultBootFileName = 'BootTidal.hs';
const defaultBootFilePath = __dirname + path.sep + defaultBootFileName;

const posixResolver = () => child_process
  .execSync(`ghc-pkg describe $(ghc-pkg latest tidal) | grep data-dir | cut -f2 -d' '`)
  .toString().trim()

const winResolver = () => child_process
  .execSync(`echo off && for /f %a in ('ghc-pkg latest tidal') do (for /f \"tokens=2\" %i in ('ghc-pkg describe %a ^| findstr data-dir') do (echo %i))`)
  .toString().trim()

const platformResolvers = {
  linux: posixResolver,
  darwin: posixResolver,
  freebsd: posixResolver,
  win32: winResolver
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
      let tidalBootPath = platformPathResolver() + path.sep + defaultBootFileName
      if (fs.existsSync(tidalBootPath)) {
        return tidalBootPath
      } else {
        return defaultBootFilePath
      }
    } else {
      return defaultBootFilePath
    }
  }

}
