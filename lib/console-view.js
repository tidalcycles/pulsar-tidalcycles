'use babel';

export default class ConsoleView {

  tidalConsole = null;
  log = null;

  constructor(status) {
    this.status = status
  }

  initUI() {
    if (this.tidalConsole) return;
    this.tidalConsole = document.createElement('div');
    this.tidalConsole.setAttribute('tabindex', -1);
    this.tidalConsole.classList.add('tidalcycles', 'console', 'native-key-bindings');
    this.tidalConsole.setAttribute('style', 'overflow-y: scroll;')

    this.log = document.createElement('div');
    this.tidalConsole.appendChild(this.log);

    atom.workspace.open({
      element: this.tidalConsole,
      getTitle: () => 'TidalCycles',
      getURI: () => 'atom://tidalcycles/console-view',
      getDefaultLocation: () => 'bottom'
    }, { activatePane: false });

    atom.workspace.getBottomDock().show()
  }

  prompt() {
    return atom.config.get('tidalcycles.consolePrompt')
      .replace("%ec", this.status.evalCount())
      .replace("%ts", this.status.timestamp())
      .replace("%diff", this.status.diff())
      + "> "
  }

  logStdout(text) {
    this.logText(text);
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

    if (atom.config.get('tidalcycles.onlyLogLastMessage')) {
      this.log.innerHTML = "";
    }
    pre.innerHTML = text;
    this.log.appendChild(pre);

    if (!error && atom.config.get('tidalcycles.onlyShowLogWhenErrors')) {
      this.tidalConsole.classList.add('hidden');
    } else {
      this.tidalConsole.classList.remove('hidden');
    }

    this.tidalConsole.scrollTop = this.tidalConsole.scrollHeight;
  }

  logMutes(mutes, lastChanged) {
    let rows = Object.entries(mutes)
      .map(entry => ({ connection: entry[0], status: entry[1] ? 'M' : 'U' }) )
      .map(mute => mute.connection == lastChanged
        ? { first: strong(mute.connection), second: strong(mute.status) }
        : { first: mute.connection, second: mute.status }
      )
      .map(row => ({
        first: row.first,
        second: new Array((row.first.length - row.second.length) + 1).join(' ') + row.second
      }))

    this.logStdout(` conn  | ${rows.map(row => row.first).join(' | ')}`)
    this.logStdout(`status | ${rows.map(row => row.second).join(' | ')}`)
  }

  serialize() {

  }

  destroy() {
    this.tidalConsole.remove();
  }
}

const strong = (string) =>`<strong>${string}</strong>`
