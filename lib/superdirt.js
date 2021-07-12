'use babel';

const Process = require('./process')
const SuperDirtStartup = require('./superdirt-startup')

export default class SuperDirt {

  element = null;
  log = null;

  constructor() {
    this.superDirtStartup = new SuperDirtStartup()
  }

  start() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.setAttribute('tabindex', -1);
      this.element.classList.add('tidalcycles', 'console', 'native-key-bindings');
      this.element.setAttribute('style', 'overflow-y: scroll;')

      this.log = document.createElement('div');
      this.element.appendChild(this.log);

      atom.workspace.open({
        element: this.element,
        getTitle: () => 'SuperDirt',
        getURI: () => 'atom://tidalcycles/superdirt-console',
        getDefaultLocation: () => 'bottom'
      }, { activatePane: false });
    }

    atom.workspace.getBottomDock().show()

    this.process = Process.superDirt(this.superDirtStartup.choosePath())
    this.process.on('stderr', data => this.logStderr(data));
    this.process.on('stdout', data => this.logStdout(data));
  }

  logStdout(text) {
    this.logText(text, false);
  }

  logStderr(text) {
    this.logText(text, true);

    if (atom.config.get('tidalcycles.showErrorNotifications')) {
      atom.notifications.addError(text)
    }
  }

  logText(text, error) {
    if (!text) return;
    var pre = document.createElement("pre");
    if (error) {
      pre.className = "error";
    }

    pre.innerHTML = text;
    this.log.appendChild(pre);

    this.element.scrollTop = this.element.scrollHeight;
  }

  // it's needed for package serialization
  serialize() { }

  destroy() {
    if (this.process) {
      this.process.destroy()
    }
    if (this.element) {
      this.element.remove()
      this.element = undefined
    }
  }

}
