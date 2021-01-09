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

  logPromptOut(text) {
    this.logStdout(this.prompt() + text);
  }

  logPromptErr(text) {
    this.logStderr(this.prompt() + text);
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

  logMutes(mutes, lastCommand) {
    let statusLine = Object.entries(mutes)
      .map(entry => entry[1] ? entry[0] : mark(entry[0]))
      .join(' | ')

    this.logPromptOut(`[${lastCommand}] - ${statusLine}`)
  }

  // it's needed for package serialization
  serialize() { }

  destroy() {
    this.tidalConsole.remove();
  }
}

const mark = (string) =>`<mark>${string}</mark>`
