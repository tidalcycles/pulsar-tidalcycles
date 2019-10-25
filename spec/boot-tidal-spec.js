const BootTidal = require('../lib/boot-tidal.js')
const fs = require('fs')

describe('boot-tidal', () => {
  let bootTidal = new BootTidal([{ path: '/current/directory' }])

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('boot file sequence', () => {

    it(`should choose current directory BootTidal.hs if it exists`, () => {
      spyOn(fs, 'existsSync').andReturn(true)

      expect(bootTidal.load()).toBe('/current/directory/BootTidal.hs')
    })

    it(`should choose custom boot file when provided`, () => {
      atom.config.set('tidalcycles.bootTidalPath', '/custom/directory/BootTidal.hs')
      spyOn(fs, 'existsSync').andReturn(true)

      expect(bootTidal.load()).toBe('/custom/directory/BootTidal.hs')
    })

    it(`should choose default boot file when no custom provided and no file in current directory`, () => {
      spyOn(fs, 'existsSync').andReturn(false)

      expect(bootTidal.load()).toContain('/lib/BootTidal.hs')
    })
  })
})
