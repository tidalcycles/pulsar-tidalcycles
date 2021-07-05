const REPL = require('../lib/repl.js')

describe('repl', () => {
  let consoleView = { logStdout: () => {}, logMutes: () => {} }
  let bootTidal = { choosePath: () => '', blocks: () => [] }
  let repl = new REPL(consoleView, {}, bootTidal)

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activate('tidalcycles'))
  })

  describe('init tidal', () => {

    it('should load BootTidal with :script', () => {
      spyOn(repl, 'tidalSendLine')
      bootTidal.choosePath = () => 'lib/BootTidal.hs'

      repl.initTidal()

      expect(repl.tidalSendLine.callCount).toBe(1)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe(':script lib/BootTidal.hs')
    })

    it('should load BootTidal sending every script block to ghci if path contains a whitespace (because ghci can\'t handle whitespaces in :script)', () => {
      spyOn(repl, 'tidalSendLine')
      spyOn(repl, 'tidalSendExpression')
      bootTidal.choosePath = () => 'lib whitespace/BootTidal.hs'
      bootTidal.blocks = () => [':set im a single expression',"im a standard\ncode block"]

      repl.initTidal()

      expect(repl.tidalSendLine.callCount).toBe(1)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe(':set im a single expression')
      expect(repl.tidalSendExpression.callCount).toBe(1)
      expect(repl.tidalSendExpression.calls[0].args[0]).toBe('im a standard\ncode block')
    })
  })

  describe('toggle mute', () => {

    it('should unmute a connection already muted', () => {
      spyOn(repl, 'tidalSendLine')

      repl.toggleMute('3')
      repl.toggleMute('3')

      expect(repl.tidalSendLine.callCount).toBe(2)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe('mute 3')
      expect(repl.tidalSendLine.calls[1].args[0]).toBe('unmute 3')
    })
  })

  describe('unmute all', () => {
    it('should unmuteAll', () => {
      spyOn(repl, 'tidalSendLine')

      repl.unmuteAll()

      expect(repl.tidalSendLine.callCount).toBe(1)
      expect(repl.tidalSendLine.calls[0].args[0]).toBe('unmuteAll')
    })
  })
})
