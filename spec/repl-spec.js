const REPL = require('../lib/repl.js')

describe('repl', () => {
  let consoleView = { logStdout: () => {} }
  let repl = new REPL(consoleView, {}, { choosePath() { return 'lib/BootTidal.hs'} })

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('init tidal', () => {

    it('should load BootTidal with :script', () => {
      spyOn(repl, 'tidalSendLine')

      repl.initTidal()

      expect(repl.tidalSendLine.callCount).toBe(1)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe(':script lib/BootTidal.hs')
    })
  })
})
