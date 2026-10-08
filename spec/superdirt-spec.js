const SuperDirt = require('../lib/superdirt')
const child_process = require('child_process')
const path = require('path')

describe('superdirt', () => {
  let superDirt

  beforeEach(() => {
    superDirt = new SuperDirt()
  })

  afterEach(() => {
    superDirt.destroy()
  })

  it('should pass the supplied startup file to sclang as a single argument', () => {
    const customPath = path.resolve('custom folder', 'my startup.scd')
    spyOn(child_process, 'spawn').and.returnValue({
      stdout: { on: () => {} },
      stderr: { on: () => {} },
      kill: () => {}
    })
    superDirt.start(customPath)

    expect(child_process.spawn).toHaveBeenCalledWith('sclang', [customPath])
  })
})
