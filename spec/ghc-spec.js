const child_process = require('child_process')
const fs = require('fs')
const Ghc = require('../lib/ghc')

describe('ghc', () => {

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('command path', () => {
    it(`should choose ghcup path by default`, () => {
      spyOn(fs, 'existsSync').andReturn(true)

      expect(Ghc.commandPath('ghci')).toBe('~/.ghcup/bin/ghci')
      expect(Ghc.commandPath('ghc-pkg')).toBe('~/.ghcup/bin/ghc-pkg')
    })

    it(`should be itself if ghcup path does not exists`, () => {
      spyOn(fs, 'existsSync').andReturn(false)

      expect(Ghc.commandPath('ghci')).toBe('ghci')
      expect(Ghc.commandPath('ghc-pkg')).toBe('ghc-pkg')
    })

    it(`should be consistent with ghciPath property if it exists`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path/ghci')

      expect(Ghc.commandPath('ghci')).toBe('/some/path/ghci')
      expect(Ghc.commandPath('ghc-pkg')).toBe('/some/path/ghc-pkg')
    })

    it(`should append command to ghciPath property if this indicates a folder`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path')

      expect(Ghc.commandPath('ghci')).toBe('/some/path/ghci')
      expect(Ghc.commandPath('ghc-pkg')).toBe('/some/path/ghc-pkg')
    })

    it(`should handle ghciPath property terminating with path separator`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path/')

      expect(Ghc.commandPath('ghci')).toBe('/some/path/ghci')
      expect(Ghc.commandPath('ghc-pkg')).toBe('/some/path/ghc-pkg')
    })

    it(`should handle stack exec path style`, () => {
      atom.config.set('tidalcycles.ghciPath', 'stack exec --package tidal – ghci')

      expect(Ghc.commandPath('ghci')).toBe('stack exec --package tidal – ghci')
      expect(Ghc.commandPath('ghc-pkg')).toBe('stack exec --package tidal – ghc-pkg')
    })
  })

  describe('tidal data dir', () => {
    it('should take data-dir path from ghc-pkg output', () => {
      spyOn(child_process, 'execSync').andReturn('data-dir: /some/path/tidal\n')

      expect(Ghc.tidalDataDir()).toBe('/some/path/tidal')
    })

    it('should handle spaces in path', () => {
      spyOn(child_process, 'execSync').andReturn('data-dir: /some/pa th/tidal\n')

      expect(Ghc.tidalDataDir()).toBe('/some/pa th/tidal')
    })

    it(`should return what it gets when there's no path in ghc-pkg path`, () => {
      spyOn(child_process, 'execSync').andReturn('no-path-in-this-output\n')

      expect(Ghc.tidalDataDir()).toBe('no-path-in-this-output')
    })

    it(`should return empty string if an error occurr`, () => {
      spyOn(child_process, 'execSync').andCallFake(() => {
        throw Error("error")
      })

      expect(Ghc.tidalDataDir()).toBe('')
    })
  })

})
