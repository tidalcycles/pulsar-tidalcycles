const child_process = require('child_process')
const fs = require('fs')
const Ghc = require('../lib/ghc')

describe('ghc', () => {

  let ghc = new Ghc({ logStdout: () => {} })

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('command path', () => {
    it(`should choose ghcup path by default`, () => {
      spyOn(fs, 'existsSync').andReturn(true)

      ghc.init()

      expect(ghc.interactivePath).toContain('/home/')
      expect(ghc.interactivePath).toContain('/.ghcup/bin/ghci')
      expect(ghc.pkgPath).toContain('/home/')
      expect(ghc.pkgPath).toContain('/.ghcup/bin/ghc-pkg')
    })

    it(`should be itself if ghcup path does not exists`, () => {
      spyOn(fs, 'existsSync').andReturn(false)

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

      expect(ghc.interactivePath).toContain('/home/')
      expect(ghc.interactivePath).toContain('/path/to/ghci')
      expect(ghc.pkgPath).toContain('/home/')
      expect(ghc.pkgPath).toContain('/path/to/ghc-pkg')
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

    it(`should handle stack exec path style`, () => {
      atom.config.set('tidalcycles.ghciPath', 'stack exec --package tidal – ghci')

      ghc.init()

      expect(ghc.interactivePath).toBe('stack exec --package tidal – ghci')
      expect(ghc.pkgPath).toBe('stack exec --package tidal – ghc-pkg')
    })
  })

  describe('tidal data dir', () => {
    it('should take data-dir path from ghc-pkg output', () => {
      spyOn(child_process, 'execSync').andReturn('data-dir: /some/path/tidal\n')

      ghc.init()

      expect(ghc.tidalDataDir()).toBe('/some/path/tidal')
    })

    it('should handle spaces in path', () => {
      spyOn(child_process, 'execSync').andReturn('data-dir: /some/pa th/tidal\n')

      ghc.init()

      expect(ghc.tidalDataDir()).toBe('/some/pa th/tidal')
    })

    it(`should return what it gets when there's no path in ghc-pkg path`, () => {
      spyOn(child_process, 'execSync').andReturn('no-path-in-this-output\n')

      ghc.init()

      expect(ghc.tidalDataDir()).toBe('no-path-in-this-output')
    })

    it(`should return empty string if an error occurr`, () => {
      spyOn(child_process, 'execSync').andCallFake(() => {
        throw Error("error")
      })

      ghc.init()

      expect(ghc.tidalDataDir()).toBe('')
    })
  })

})
