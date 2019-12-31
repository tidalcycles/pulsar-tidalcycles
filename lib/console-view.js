'use babel';

class ConsoleView {

  tidalConsole = null;
  log = null;

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
        }, { activatePane: false});

        atom.workspace.getBottomDock().show()
    }

    serialize() {

    }

    destroy() {
        this.tidalConsole.remove();
    }

    logStdout(text) {
        this.logText(text);
    }

    logStderr(text) {
        this.logText(text, true);
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
}

export default ConsoleView;
