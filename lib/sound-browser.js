'use babel'

const path = require('path');
const fs = require('fs');
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

      let folderElement = document.createElement('ul')
      this.browser.appendChild(folderElement)

      this.render(folderElement, tree)
    })

    atom.workspace.open({
      element: this.browser,
      getTitle: () => 'Sound Browser',
      getURI: () => 'atom://tidalcycles/sound-browser',
      getDefaultLocation: () => 'left'
    }, { activatePane: false });

    atom.workspace.getLeftDock().show()
  }

  render(rootElement, tree) {
    let element = document.createElement('li')
    element.textContent = tree.name
    rootElement.appendChild(element)

    if (tree.type === 'directory') {
      let folderElement = document.createElement('ul')
      element.appendChild(folderElement)
      tree.children.forEach(subTree => this.render(folderElement, subTree))
    }
  }

  destroy() {
    this.browser.remove();
  }
}
