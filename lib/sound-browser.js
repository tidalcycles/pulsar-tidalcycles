'use babel'

const dirTree = require("directory-tree")
const path = require('path')

export default class SoundBrowser {

  constructor() {
    this.browser = null
  }

  init(soundFolders) {
    this.browser = document.createElement('div')
    this.browser.style.overflowY = 'scroll'

    let trees = soundFolders
      .map(folder => {
        let tree = dirTree(folder, { extensions: /\.(wav|aiff)/, exclude: /.git/ })
        if (!tree) {
          atom.notifications.addError(`Sound browser: the path ${folder} is invalid`)
        }
        return tree
      })
      .filter(tree => tree)

    if (trees.length > 0) {
      trees.forEach(tree => this.render(this.browser, tree, 0))

      atom.workspace.open({
        element: this.browser,
        getTitle: () => 'Sound Browser',
        getURI: () => 'atom://tidalcycles/sound-browser',
        getDefaultLocation: () => 'left'
      }, { activatePane: false });
    }
  }

  render(rootElement, tree, number) {
    let element = document.createElement('li')

    element.style.cursor = 'pointer'
    rootElement.appendChild(element)

    if (tree.type === 'directory') {
      element.textContent = tree.name

      let directoryElement = document.createElement('ul')
      element.onclick = _ => this.toggleDisplay(directoryElement)
      if (rootElement !== this.browser) {
        this.toggleDisplay(directoryElement)
      }
      rootElement.appendChild(directoryElement)
      tree.children
        .forEach((subTree, index) => this.render(directoryElement, subTree, index))
    } else {
      element.textContent = path.basename(path.dirname(tree.path)) + ":" + number
      let audio = this.audio(tree.path)
      audio.onplay = _ => element.style.fontWeight = 'bold'
      audio.onpause = _ => element.style.fontWeight = 'normal'
      element.onclick = _ => audio.paused ? audio.play() : audio.pause()
    }
  }

  audio(filePath) {
    let audio = document.createElement('audio')
    audio.id = filePath
    audio.src = filePath
    audio.autostart = false
    audio.preload = 'none'
    return audio
  }

  toggleDisplay(element) {
    if (element.style.display === 'none') {
      element.style.display = 'block'
    } else {
      element.style.display = 'none'
    }
  }

  destroy() {
    this.browser.remove();
  }
}
