'use babel'

const dirTree = require("directory-tree")
const path = require('path')
let activeAudio = null;

export default class SoundBrowser {

  constructor() {
    this.browser = null
  }

  init(soundFolders) {
    this.browser = document.createElement('div')
    this.browser.classList.add('atom-sound-browser')
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
      element.classList.add('icon', 'icon-open')

      let directoryElement = document.createElement('ul')
      element.onclick = _ => {
        this.toggleDisplay(element, directoryElement)
      }
      if (rootElement !== this.browser) {
        this.toggleDisplay(element, directoryElement)
      }
      rootElement.appendChild(directoryElement)

      tree.children
        .forEach((subTree, index) => this.render(directoryElement, subTree, index))
    } else {
      element.textContent = path.basename(path.dirname(tree.path)) + ":" + number
      element.classList.add('icon', 'icon-speaker')

      let audioIcon = document.createElement('span');
      audioIcon.classList.add('icon-play');
      element.appendChild(audioIcon);

      let audio = this.audio(tree.path)
      audio.onplay = _ => {
        element.style.fontWeight = 'bold';
        this.setPlayStatuIcons(audioIcon, true);
      };
      audio.onpause = _ => {
        element.style.fontWeight = 'normal';
        this.setPlayStatuIcons(audioIcon, false);
      }
      element.onclick = _ => {

        if (audio.paused) {
          audio.play();

          if (activeAudio !== null && activeAudio !== audio) {
            activeAudio.pause();
            activeAudio.currentTime = 0;
          }

          activeAudio = audio;
          this.setPlayStatuIcons(audioIcon, true);
        } else {
          audio.pause();
          audio.currentTime = 0;
          this.setPlayStatuIcons(audioIcon, false);
        }
      };
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

  setPlayStatuIcons (element, isPlaying) {
    if (isPlaying) {
      element.classList.remove('icon-play');
      element.classList.add('icon-stop');
    }  else {
      element.classList.remove('icon-stop');
      element.classList.add('icon-play');
    }
  }

  toggleDisplay(parent, element) {
    parent.classList.toggle('icon-open');
    parent.classList.toggle('icon-close');

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
