const REPL = require('../lib/repl.js')

describe('repl', () => {
  it('should load code blocks on boot', () => {
    let repl = new REPL()
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
    let repl = new REPL()
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
