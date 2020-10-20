'use babel'

const dirTree = require("directory-tree")

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
      this.render(this.browser, tree, tree.name, 0)
    })

    atom.workspace.open({
      element: this.browser,
      getTitle: () => 'Sound Browser',
      getURI: () => 'atom://tidalcycles/sound-browser',
      getDefaultLocation: () => 'left'
    }, { activatePane: false });

    atom.workspace.getLeftDock().show()
  }

  render(rootElement, tree, level) {
    let element = document.createElement('li')
    element.textContent = tree.name
    rootElement.appendChild(element)

    if (tree.type === 'directory') {
      let newLevel = level + 1

      let directoryElement = document.createElement('ul')
      directoryElement.style.cursor = 'pointer'

      element.onclick = _ => this.toggleDisplay(directoryElement)

      if (level > 0) {
        this.toggleDisplay(directoryElement)
      }

      rootElement.appendChild(directoryElement)
      tree.children.forEach(subTree => this.render(directoryElement, subTree, newLevel))
    }
  }

  toggleDisplay(element) {
    if (element.style.display === 'block') {
      element.style.display = 'none'
    } else {
      element.style.display = 'block'
    }
  }

  destroy() {
    this.browser.remove();
  }
}
