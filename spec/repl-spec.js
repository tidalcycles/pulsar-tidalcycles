const REPL = require('../lib/repl.js')
const BootTidal = require('../lib/boot-tidal')
const fs = require('fs')

describe('repl', () => {
  let consoleView = { logStdout: () => {} }
  let repl = new REPL(consoleView)

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('init tidal', () => {

    it('should load BootTidal with :script', () => {
      spyOn(BootTidal, 'getPath').andReturn("lib/BootTidal.hs")
      spyOn(repl, 'tidalSendLine')

      repl.initTidal()

      expect(repl.tidalSendLine.callCount).toBe(1)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe(':script lib/BootTidal.hs')
    })
  })
})
