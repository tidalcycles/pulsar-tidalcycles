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

  describe('toggle mute', () => {
    it('should mute a connection not already muted', () => {
      spyOn(repl, 'tidalSendLine')

      repl.toggleMute('3')

      expect(repl.eval.callCount).toBe(1)
      expect(repl.eval.calls[0].args[1]).toBe('mute 3')
    })

    it('should map connection 0 as 10', () => {
      spyOn(repl, 'tidalSendLine')

      repl.toggleMute('0')

      expect(repl.eval.callCount).toBe(1)
      expect(repl.eval.calls[0].args[1]).toBe('mute 10')
    })
  })
})
