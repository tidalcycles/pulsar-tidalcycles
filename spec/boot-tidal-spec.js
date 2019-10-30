const BootTidal = require('../lib/boot-tidal')
const Ghc = require('../lib/ghc')
const fs = require('fs')
const child_process = require('child_process')

describe('boot-tidal', () => {
  let bootTidal = new BootTidal([{ path: '/current/directory' }])

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('boot file sequence', () => {

    it(`should choose current directory BootTidal.hs if it exists`, () => {
      spyOn(fs, 'existsSync').andReturn(true)

      expect(bootTidal.choosePath()).toBe('/current/directory/BootTidal.hs')
    })

    it(`should choose custom boot file when provided`, () => {
      atom.config.set('tidalcycles.bootTidalPath', '/custom/directory/BootTidal.hs')
      spyOn(fs, 'existsSync').andReturn(true)

      expect(bootTidal.choosePath()).toBe('/custom/directory/BootTidal.hs')
    })

    it('should use installation boot file when it exists and no custom provided and no file in current directory', () => {
      spyOn(fs, 'existsSync').andCallFake(path => {
        switch (path) {
          case '/some/path/tidal/BootTidal.hs': return true;
          default: return false;
        }
      });
      spyOn(Ghc, 'tidalDataDir').andReturn('/some/path/tidal')

      expect(bootTidal.choosePath()).toBe('/some/path/tidal/BootTidal.hs')
    })

    it('should choose default boot file when no custom provided, no file in current directory and platform resolved file does not exist', () => {
      spyOn(fs, 'existsSync').andCallFake(path => {
        switch (path) {
          case '/unexistent/path': return false;
          default: return false;
        }
      });
      spyOn(Ghc, 'tidalDataDir').andReturn('/unexistent/path')

      expect(bootTidal.choosePath()).toContain('/lib/BootTidal.hs')
    })

  })
})
