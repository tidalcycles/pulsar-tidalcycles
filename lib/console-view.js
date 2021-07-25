'use babel';

export default class ConsoleView {

  element = null;
  log = null;

  constructor(status) {
    this.status = status
    this.rows = []
  }

  initUI() {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.setAttribute('tabindex', -1);
    this.element.classList.add('tidalcycles', 'console', 'native-key-bindings');
    this.element.setAttribute('style', 'overflow-y: scroll;')

    this.log = document.createElement('div');
    this.element.appendChild(this.log);

    atom.workspace.open({
      element: this.element,
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

  appendLog(text) {
    this.rows.push(text)
  }

  flushLog() {
    let text = this.rows.join('\n')
    this.rows = []
    this.logText(text)
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
      this.element.classList.add('hidden');
    } else {
      this.element.classList.remove('hidden');
    }

    this.element.scrollTop = this.element.scrollHeight;
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
    this.element.remove();
  }
}

const mark = (string) =>`<mark>${string}</mark>`
