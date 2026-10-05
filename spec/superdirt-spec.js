const SuperDirt = require('../lib/superdirt')
const child_process = require('child_process')
const path = require('path')

describe('superdirt', () => {
  let superDirt

  beforeEach(() => {
    atom.config.unset('tidalcycles.superDirt.startupPath')
    superDirt = new SuperDirt()
  })

  afterEach(() => {
    superDirt.destroy()
    atom.config.unset('tidalcycles.superDirt.startupPath')
  })

  it('should pass the configured startup file to sclang as a single argument', () => {
    const customPath = path.resolve('custom folder', 'my startup.scd')
    atom.config.set('tidalcycles.superDirt.startupPath', customPath)
    spyOn(child_process, 'spawn').and.returnValue({
      stdout: { on: () => {} },
      stderr: { on: () => {} },
      kill: () => {}
    })
    spyOn(atom.workspace, 'open').and.returnValue(Promise.resolve())
    spyOn(atom.workspace.getBottomDock(), 'show')

    superDirt.start()

    expect(child_process.spawn).toHaveBeenCalledWith('sclang', [customPath])
  })
})
