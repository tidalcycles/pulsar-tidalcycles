'use babel'

const dirTree = require("directory-tree")

export default class SoundBrowser {

  browser = null;

  constructor() { }

  init(soundFolders) {

    this.browser = document.createElement('div')
    this.browser.setAttribute('style', 'overflow-y: scroll;')

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

  render(rootElement, tree, id, level) {
    let element = document.createElement('li')
    element.id = id
    element.textContent = tree.name
    rootElement.appendChild(element)

    if (tree.type === 'directory') {
      let newLevel = level + 1
      let subId = id + '.ul'

      let directoryElement = document.createElement('ul')
      directoryElement.id = subId
      directoryElement.setAttribute('style', 'cursor: pointer')

      element.onclick = _ => this.toggleDisplay(directoryElement)

      if (level > 0) {
        directoryElement.setAttribute('style', 'display: none;')
      }

      rootElement.appendChild(directoryElement)
      tree.children.forEach(subTree => this.render(directoryElement, subTree, subId + '.' + subTree.name, newLevel))
    }
  }

  toggleDisplay(element) {
    if (element.getAttribute('style') === 'display: block;') {
      element.setAttribute('style', 'display: none;')
    } else {
      element.setAttribute('style', 'display: block;')
    }
  }

  destroy() {
    this.browser.remove();
  }
}
