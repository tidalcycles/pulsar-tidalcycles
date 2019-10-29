const Ghci = require('../lib/ghci')

describe('ghci', () => {

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('command path', () => {
    it(`should be itself by default`, () => {
      expect(Ghci.commandPath('ghci')).toBe('ghci')
      expect(Ghci.commandPath('ghc-pkg')).toBe('ghc-pkg')
    })

    it(`should be consistent with ghciPath property if it exists`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path/ghci')

      expect(Ghci.commandPath('ghci')).toBe('/some/path/ghci')
      expect(Ghci.commandPath('ghc-pkg')).toBe('/some/path/ghc-pkg')
    })

    it(`should append command to ghciPath property if this indicates a folder`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path')

      expect(Ghci.commandPath('ghci')).toBe('/some/path/ghci')
      expect(Ghci.commandPath('ghc-pkg')).toBe('/some/path/ghc-pkg')
    })

    it(`should handle ghciPath property terminating with path separator`, () => {
      atom.config.set('tidalcycles.ghciPath', '/some/path/')

      expect(Ghci.commandPath('ghci')).toBe('/some/path/ghci')
      expect(Ghci.commandPath('ghc-pkg')).toBe('/some/path/ghc-pkg')
    })
  })

})
