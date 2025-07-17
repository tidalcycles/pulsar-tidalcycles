const child_process = require('child_process')
const fs = require('fs')
const os = require('os')
const Ghc = require('../lib/ghc')

describe('ghc', () => {

  let ghc = new Ghc({ logStdout: () => {}, logStderr: () => {}, appendLog: () => {}, flushLog: () => {} })

  beforeEach(async () => {
    await atom.packages.activate('tidalcycles');
  })

  describe('command path', () => {
    it(`should choose ghcup path by default`, () => {
      spyOn(fs, 'existsSync').and.returnValue(true)

      ghc.init()

      expect(ghc.interactivePath).toBe(os.homedir() + '/.ghcup/bin/ghci')
      expect(ghc.pkgPath).toContain(os.homedir() + '/.ghcup/bin/ghc-pkg')
    })

    it(`should be itself if ghcup path does not exists`, () => {
      spyOn(fs, 'existsSync').and.returnValue(false)

      ghc.init()

      expect(ghc.interactivePath).toBe('ghci')
      expect(ghc.pkgPath).toBe('ghc-pkg')
    })

    it(`should be consistent with ghciPath property if it exists`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path/ghci')

      ghc.init()

      expect(ghc.interactivePath).toBe('/some/path/ghci')
      expect(ghc.pkgPath).toBe('/some/path/ghc-pkg')
    })

    it(`should replace tilde with home path from ghciPath property if it exists`, () => {
      atom.config.set('tidalcycles.ghciPath', '~/path/to/ghci')

      ghc.init()

      expect(ghc.interactivePath).toBe(os.homedir() + '/path/to/ghci')
      expect(ghc.pkgPath).toBe(os.homedir() + '/path/to/ghc-pkg')
    })

    it(`should append command to ghciPath property if this indicates a folder`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path')

      ghc.init()

      expect(ghc.interactivePath).toBe('/some/path/ghci')
      expect(ghc.pkgPath).toBe('/some/path/ghc-pkg')
    })

    it(`should handle ghciPath property terminating with path separator`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path/')

      ghc.init()

      expect(ghc.interactivePath).toBe('/some/path/ghci')
      expect(ghc.pkgPath).toBe('/some/path/ghc-pkg')
    })

    it(`should handle stack interpreter`, () => {
      atom.config.set('tidalcycles.interpreter', 'stack')

      ghc.init()

      expect(ghc.interactivePath).toBe('stack exec --package tidal ghci')
      expect(ghc.pkgPath).toBe('stack exec --package tidal ghc-pkg')
    })

    it(`should handle nix interpreter`, () => {
      atom.config.set('tidalcycles.interpreter', 'nix')

      ghc.init()

      expect(ghc.interactivePath).toBe('nix-shell -p "haskellPackages.ghcWithPackages (pkgs: [pkgs.tidal])" --run ghci')
      expect(ghc.pkgPath).toBe('nix-shell -p "haskellPackages.ghcWithPackages (pkgs: [pkgs.tidal])" --run "ghc-pkg"')
    })
  })

  describe('ghc-pkg command', () => {
    it('should execute ghc-pkg command and trim the result', () => {
      spyOn(child_process, 'execSync').and.returnValue(' command result \n')

      let commandResult = ghc.pkg('command definition')

      expect(commandResult).toBe('command result')
    })

    it(`should wrap ghc-pkg in double quotes for default interpreter to handle whitespaces in path`, () => {
      spyOn(child_process, 'execSync').and.returnValue('')
      atom.config.set('tidalcycles.interpreter', 'default')
      atom.config.set('tidalcycles.ghciPath', '/path with whitespace')

      ghc.init()
      ghc.pkg('command arguments')

      expect(child_process.execSync).toHaveBeenCalledWith('"/path with whitespace/ghc-pkg" command arguments')
    })

    it(`should not wrap ghc-pkg in double quotes for stack interpreter`, () => {
      spyOn(child_process, 'execSync').and.returnValue('')
      atom.config.set('tidalcycles.interpreter', 'stack')

      ghc.init()
      ghc.pkg('command arguments')

      expect(child_process.execSync).toHaveBeenCalledWith('stack exec --package tidal ghc-pkg command arguments')
    })

    it(`should not wrap ghc-pkg in double quotes for nix interpreter`, () => {
      spyOn(child_process, 'execSync').and.returnValue('')
      atom.config.set('tidalcycles.interpreter', 'nix')

      ghc.init()
      ghc.pkg('command arguments')

      expect(child_process.execSync).toHaveBeenCalledWith('nix-shell -p "haskellPackages.ghcWithPackages (pkgs: [pkgs.tidal])" --run "ghc-pkg command arguments"')
    })
  })

  describe('tidal data dir', () => {
    it('should handle spaces in returning path', () => {
      spyOn(ghc, 'pkg').and.returnValue('data-dir: /some/pa th/tidal\n')

      ghc.tidalDataDir()

      expect(ghc.tidalDataDir()).toBe('/some/pa th/tidal')
    })

    it(`should return what it gets when there's no path in ghc-pkg path`, () => {
      spyOn(ghc, 'pkg').and.returnValue('no-path-in-this-output\n')

      ghc.tidalDataDir()

      expect(ghc.tidalDataDir()).toBe('no-path-in-this-output')
    })
  })

  describe('browseTidal', () => {
    it(`should wrap ghci path with double quotes for default interpreter to handle whitespace-in-path`, () => {
      atom.config.set('tidalcycles.interpreter', 'default')
      atom.config.set('tidalcycles.ghciPath', '/path whitespace/')
      spyOn(child_process, 'exec')

      ghc.init()
      ghc.browseTidal(() => {})

      expect(child_process.exec.calls.mostRecent().args[0]).toBe('echo ":browse Sound.Tidal.Context" | "/path whitespace/ghci"')
    })

    it(`should not wrap ghci path with double quotes for stack interpreter`, () => {
      atom.config.set('tidalcycles.interpreter', 'stack')
      spyOn(child_process, 'exec')

      ghc.init()
      ghc.browseTidal(() => {})

      expect(child_process.exec.calls.mostRecent().args[0]).toBe('echo ":browse Sound.Tidal.Context" | stack exec --package tidal ghci')
    })

    it(`should not wrap ghci path with double quotes for nix interpreter`, () => {
      atom.config.set('tidalcycles.interpreter', 'nix')
      spyOn(child_process, 'exec')

      ghc.init()
      ghc.browseTidal(() => {})

      expect(child_process.exec.calls.mostRecent().args[0]).toBe('echo ":browse Sound.Tidal.Context" | nix-shell -p "haskellPackages.ghcWithPackages (pkgs: [pkgs.tidal])" --run ghci')
    })
  })

  describe(`interactive`, () => {
    it(`should wrap ghci path with double quotes when interpreter is default`, () => {
      atom.config.set('tidalcycles.interpreter', 'default')
      atom.config.set('tidalcycles.ghciPath', '/path whitespace/')
      spyOn(child_process, 'spawn').and.returnValue({ stderr: { on: () => {}}, stdout: {on: () => {}}})

      ghc.init()
      ghc.interactive()

      expect(child_process.spawn.calls.mostRecent().args[0]).toBe('"/path whitespace/ghci"')
    })

    it(`should not wrap ghci path with double quotes when interpreter is stack`, () => {
      atom.config.set('tidalcycles.interpreter', 'stack')
      spyOn(child_process, 'spawn').and.returnValue({ stderr: { on: () => {}}, stdout: {on: () => {}}})

      ghc.init()
      ghc.interactive()

      expect(child_process.spawn.calls.mostRecent().args[0]).toBe('stack exec --package tidal ghci')
    })

    it(`should not wrap ghci path with double quotes when interpreter is nix`, () => {
      atom.config.set('tidalcycles.interpreter', 'nix')
      spyOn(child_process, 'spawn').and.returnValue({ stderr: { on: () => {}}, stdout: {on: () => {}}})

      ghc.init()
      ghc.interactive()

      expect(child_process.spawn.calls.mostRecent().args[0]).toBe('nix-shell -p "haskellPackages.ghcWithPackages (pkgs: [pkgs.tidal])" --run ghci')
    })
  })

})
