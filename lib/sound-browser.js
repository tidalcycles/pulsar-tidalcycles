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

    console.time("Init Search");
    this.initSearch()
    console.timeEnd("Init Search");

    let trees = soundFolders
      .map(folder => {
        let tree = dirTree(folder, {
          extensions: /\.(wav|aiff)/,
          exclude: /.git/,
          attributes: ['type']
        })
        if (!tree) {
          atom.notifications.addError(`Sound browser: the path ${folder} is invalid`)
        }
        return tree
      })
      .filter(tree => tree)

    if (trees.length > 0) {
      trees.forEach(tree => this.render(this.browser, tree, 0))

      console.time("OpenWS");
      atom.workspace.open({
        element: this.browser,
        getTitle: () => 'Sound Browser',
        getURI: () => 'atom://tidalcycles/sound-browser',
        getDefaultLocation: () => 'left'
      }, { activatePane: false });
      console.timeEnd("OpenWS");
    }
  }

  render(rootElement, tree, number) {
    let element = document.createElement('li')

    element.style.cursor = 'pointer'

    rootElement.appendChild(element)

    if (tree.type === 'directory') {
      element.textContent = tree.name
      element.classList.add('icon', 'icon-open', 'tidal-dir')

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
      let dirName = path.basename(path.dirname(tree.path))
      let filename = path.basename(tree.path, path.extname(tree.path))
      element.textContent = `${dirName}:${number} / ${filename}`
      element.classList.add('icon', 'icon-speaker', 'tidal-sample')

      let audioIcon = document.createElement('span');
      element.appendChild(audioIcon);

      let audio = this.audio(tree.path)
      audio.onplay = _ => {
        element.style.fontWeight = 'bold';
        this.setSpeakerIcon(audioIcon, true);
      };
      audio.onpause = _ => {
        element.style.fontWeight = 'normal';
        this.setSpeakerIcon(audioIcon, false);
      };
      element.onclick = _ => {

        if (audio.paused) {
          audio.play();

          if (activeAudio !== null && activeAudio !== audio) {
            activeAudio.pause();
            activeAudio.currentTime = 0;
          }

          activeAudio = audio;
          this.setSpeakerIcon(audioIcon, true);
        } else {
          audio.pause();
          audio.currentTime = 0;
          this.setSpeakerIcon(audioIcon, false);
        }
      };
    }
  }

  audio(filePath) {
    let escapedPath = filePath.replace('#', '%23')
    let audio = document.createElement('audio')
    audio.id = escapedPath
    audio.src = escapedPath
    audio.autostart = false
    audio.preload = 'none'
    return audio
  }

  setSpeakerIcon (element, played) {
    played ?
        element.classList.add('icon-speaker') :
        element.classList.remove('icon-speaker');
  }

  initSearch() {

    this.searchBox = document.createElement("input")
    this.searchBox.type = "text"
    this.searchBox.id = "search"
    this.searchBox.placeholder = "Search your Samples"
    this.searchBox.classList.add("searchBox")
    this.searchBox.style.backgroundColor= "#333"

    this.clearButton = document.createElement("button")
    this.clearButton.type = "button"
    this.clearButton.style.cursor = "pointer"
    this.clearButton.style.backgroundColor = "#046DAA;"
    this.clearButton.style.padding = "5px"
    this.clearButton.textContent = "[X]"

    // this.clearButton.onClick = (this.searchBox) => {
      // searchBox.textContent = ""
      // console.log("Reset query.")
    // }

    const filterElement = function(element, searchText, folders) {
      const dir = element.parentNode.previousSibling
      const rootDir = element.parentNode.parentNode.previousSibling
      searchText = searchText.toLowerCase().trim()
      let display = "block"
      let weight = "normal"

      if (searchText.length != 0) {
        var isMatch = element.innerText.toLowerCase().includes(searchText)
        display = isMatch ? "block" : "none"
        weight = isMatch ? "bold": "normal"

        // if (selected) {
          // console.log(`Matched ${element.innerText}! (${dir.innerText}) -> ${display}/${weight}`)
        // }
      }
      element.style.display = display
      element.style.fontWeight = weight
      dir.style.display = display
      dir.style.fontWeight = weight
      rootDir.style.fontWeight = weight
    }

    const filterEmptyDir = (dir) => {
      if (dir.children.length > 0) {
        console.log("Dir ", dir.innerText, ":", dir.classList, " has ", dir.children.length, " children:");
        for (var i=0;i<dir.children.length;i++) {
          let child = dir.children[i];
          console.log(child.classList);
        }
      }

    }

    // TODO: Debounce input might improve UX?
    function debounce(func, timeout = 300){
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          console.log("TIMEOUT");
          func.apply(this, args);
        }, timeout);
      };
    }
    // const processChange = debounce(() => saveInput());

    const onchange = function(e) {
      let searchText = e.target.value
      let samples = document.getElementsByClassName("tidal-sample")
      let dirs = document.getElementsByClassName("tidal-dir")
      // DEBUG PRINT: Helps see when query is received
      // console.log("Q: ", searchText, "L(D)=", dirs.length, "L(S)=", samples.length);
      if (searchText.length < 2 && searchText != " ") {
        console.error("DEBOUNCE: Ignoring tiny query ", searchText, ".")
        return
      }
      console.time('samples');
      Array.from(samples).forEach(
        (sample) => filterElement(sample, searchText, this.soundFolders)
      )
      console.timeEnd('samples');
      console.time('dirs');
      // var printed=0;
      Array.from(dirs).forEach(
        (dir) => {
          // if (printed++ < 3) {
            // console.log(`Processing ${dir}...`);
            // console.log(dir);
          // }
          filterEmptyDir(dir)
        }
      )
      console.timeEnd('dirs');
    }

    this.searchBox.addEventListener('input', onchange);
    this.searchBox.addEventListener('propertychange', onchange);

    this.browser.appendChild(this.searchBox)
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
