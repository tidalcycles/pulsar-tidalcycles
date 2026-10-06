const SuperDirtStartup = require('../lib/superdirt-startup')
const fs = require('fs')
const path = require('path')

describe('superdirt-startup', () => {
  const startupPathProperty = 'tidalcycles.superDirt.startupPath'
  const projectPath = path.resolve('project')
  const projectStartupPath = path.join(projectPath, 'superdirt_startup.scd')
  const defaultStartupPath = path.resolve(__dirname, '../lib/superdirt_startup.scd')
  let startup

  beforeEach(() => {
    atom.config.unset(startupPathProperty)
    startup = new SuperDirtStartup()
  })

  afterEach(() => {
    atom.config.unset(startupPathProperty)
  })

  it('should prefer a configured startup file over the project file', () => {
    startup.rootDirectories = [{ path: projectPath }]
    const customPath = path.resolve('custom', 'startup.scd')
    atom.config.set(startupPathProperty, customPath)
    spyOn(fs, 'existsSync').and.returnValue(true)

    expect(startup.choosePath()).toBe(customPath)
    expect(fs.existsSync).not.toHaveBeenCalled()
  })

  it('should use a configured startup file without a project folder', () => {
    const customPath = path.resolve('custom', 'startup.scd')
    atom.config.set(startupPathProperty, customPath)
    startup.rootDirectories = []

    expect(startup.choosePath()).toBe(customPath)
  })

  it('should preserve spaces in a configured startup path', () => {
    const customPath = path.resolve('custom folder', 'my startup.scd')
    atom.config.set(startupPathProperty, customPath)

    expect(startup.choosePath()).toBe(customPath)
  })

  it('should not silently fall back when the configured file is missing', () => {
    const customPath = path.resolve('missing', 'startup.scd')
    atom.config.set(startupPathProperty, customPath)
    spyOn(fs, 'existsSync').and.returnValue(false)

    expect(startup.choosePath()).toBe(customPath)
  })

  it('should choose the project startup file when no path is configured', () => {
    startup.rootDirectories = [{ path: projectPath }]
    spyOn(fs, 'existsSync').and.returnValue(true)

    expect(startup.choosePath()).toBe(projectStartupPath)
  })

  it('should choose the project startup file when the configured path is empty', () => {
    startup.rootDirectories = [{ path: projectPath }]
    atom.config.set(startupPathProperty, '')
    spyOn(fs, 'existsSync').and.returnValue(true)

    expect(startup.choosePath()).toBe(projectStartupPath)
  })

  it('should choose the bundled startup file when the project file is missing', () => {
    startup.rootDirectories = [{ path: projectPath }]
    spyOn(fs, 'existsSync').and.returnValue(false)

    expect(startup.choosePath()).toBe(defaultStartupPath)
  })

  it('should choose the bundled startup file without a project folder', () => {
    startup.rootDirectories = []

    expect(startup.choosePath()).toBe(defaultStartupPath)
  })
})
