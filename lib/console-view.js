'use babel';

class ConsoleView {
    constructor(serializeState) {
        this.tidalConsole = null;
        this.log = null;
    }

    initUI() {
        if (this.tidalConsole) return;
        this.tidalConsole = document.createElement('div');
        this.tidalConsole.setAttribute('tabindex', -1);
        this.tidalConsole.classList.add('tidalcycles', 'console', 'native-key-bindings');

        this.log = document.createElement('div');
        this.log.setAttribute('style', 'overflow-y: scroll; white-space: pre-wrap;')
        this.tidalConsole.appendChild(this.log);

        atom.workspace.open({
          element: this.tidalConsole,
          getTitle: () => 'TidalCycles',
          getURI: () => 'atom://tidalcycles/console-view',
          getDefaultLocation: () => 'bottom'
        }, { activatePane: false});
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

        this.log.scrollTop = this.log.scrollHeight;

    }
}

export default ConsoleView;
