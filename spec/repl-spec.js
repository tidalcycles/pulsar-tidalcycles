const REPL = require('../lib/repl.js')
const fs = require('fs')

describe('repl', () => {
  let repl = new REPL()

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('init tidal', () => {

    it('should load code blocks on boot', () => {
      spyOn(repl, 'getBootTidalPath').andReturn("lib/BootTidal.hs")
      spyOn(repl, 'tidalSendLine')
      spyOn(repl, 'tidalSendExpression')

      repl.initTidal()

      expect(repl.tidalSendLine.callCount).toBe(5)
      expect(repl.tidalSendExpression.callCount).toBe(4)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe(':set -XOverloadedStrings')
      expect(repl.tidalSendExpression.calls[1].args[0]).toBe('-- total latency = oLatency + cFrameTimespan\ntidal <- startTidal (superdirtTarget {oLatency = 0.1, oAddress = "127.0.0.1", oPort = 57120}) (defaultConfig {cFrameTimespan = 1/20})')
    })

    it('should send :set lines as single lines on boot', () => {
      spyOn(repl, 'getBootTidalPath').andReturn("lib/BootTidal.hs")
      spyOn(repl, 'tidalSendLine')
      spyOn(repl, 'tidalSendExpression')

      repl.initTidal()

      expect(repl.tidalSendLine.calls[0].args[0]).toBe(':set -XOverloadedStrings')
      expect(repl.tidalSendLine.calls[1].args[0]).toBe(':set prompt ""')
      expect(repl.tidalSendLine.calls[2].args[0]).toBe(':set prompt-cont ""')
      expect(repl.tidalSendLine.calls[3].args[0]).toBe(':set prompt "tidal> "')
    })
  })

  describe('boot file sequence', () => {
    let rootDirectories = [{ path: '/current/directory' }]

    it(`should choose current directory BootTidal.hs if it exists`, () => {
      spyOn(fs, 'existsSync').andReturn(true)

      expect(repl.getBootTidalPath(rootDirectories)).toBe('/current/directory/BootTidal.hs')
    })

    it(`should choose custom boot file when provided`, () => {
      atom.config.set('tidalcycles.bootTidalPath', '/custom/directory/BootTidal.hs')
      spyOn(fs, 'existsSync').andReturn(true)

      expect(repl.getBootTidalPath(rootDirectories)).toBe('/custom/directory/BootTidal.hs')
    })

    it(`should choose default boot file when no custom provided and no file in current directory`, () => {
      spyOn(fs, 'existsSync').andReturn(false)

      expect(repl.getBootTidalPath([])).toContain('/lib/BootTidal.hs')
    })
  })
})
