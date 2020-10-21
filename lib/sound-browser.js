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

    soundFolders.forEach(folder => {
      const tree = dirTree(folder, {
        extensions: /\.wav/,
        exclude: /.git/
      });

      console.log(tree)
      if (tree != null) {
        this.render(this.browser, tree, folder)
      } else {
        atom.notifications.addError(`Sound browser: the path ${folder} is invalid`)
      }

    })

    atom.workspace.open({
      element: this.browser,
      getTitle: () => 'Sound Browser',
      getURI: () => 'atom://tidalcycles/sound-browser',
      getDefaultLocation: () => 'left'
    }, { activatePane: false });

    atom.workspace.getLeftDock().show()
  }

  render(rootElement, tree, filePath) {
    let element = document.createElement('li')
    element.textContent = tree.name
    element.style.cursor = 'pointer'
    rootElement.appendChild(element)

    if (tree.type === 'directory') {
      let directoryElement = document.createElement('ul')
      element.onclick = _ => this.toggleDisplay(directoryElement)
      if (rootElement !== this.browser) {
        this.toggleDisplay(directoryElement)
      }
      rootElement.appendChild(directoryElement)
      tree.children.forEach(subTree =>
        this.render(directoryElement, subTree, path.resolve(filePath, subTree.name)))
    } else {
      let audio = document.createElement('audio')
      audio.id = filePath
      audio.src = filePath
      audio.autostart = false
      audio.preload = 'none'
      audio.onplay = _ => element.style.fontWeight = 'bold'
      audio.onpause = _ => element.style.fontWeight = 'normal'
      element.onclick = _ => audio.paused ? audio.play() : audio.pause()
    }
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
