'use babel';

const Status = require('./status')
const Editor = require('./editor')

let status = new Status()

export default class REPL {

  ghci = null
  consoleView = null
  stdErr = null
  stdOut = null
  stdTimer = 0

  constructor(consoleView, ghc, bootTidal) {
    this.consoleView = consoleView;
    this.stdErr = []
    this.stdOut = []
    this.ghc = ghc
    this.bootTidal = bootTidal

    this.mutes = [...Array(10).keys()]
      .reduce((acc, cur) => {
        acc[`${cur+1}`] = false
        return acc;
      }, {});
    this.mutes['all'] = false

    // TODO: maybe the commands definition could stay elsewhere
    atom.commands.add('atom-workspace', {
      'tidalcycles:boot': () => {
        if (Editor.isTidal()) {
          this.start();
        } else {
          console.error('Not a .tidal file.');
        }
      },
      'tidalcycles:reboot': () => {
        this.destroy();
        this.start();
      }
    });

    atom.commands.add('atom-text-editor', {
      'tidalcycles:eval': () => this.eval(Editor.LINE, false),
      'tidalcycles:eval-multi-line': () => this.eval(Editor.MULTI_LINE, false),
      'tidalcycles:eval-whole-editor': () => this.eval(Editor.WHOLE_EDITOR, false),
      'tidalcycles:eval-copy': () => this.eval(Editor.LINE, true),
      'tidalcycles:eval-multi-line-copy': () => this.eval(Editor.MULTI_LINE, true),
      'tidalcycles:toggle-mute': (event) => this.toggleMute(event.originalEvent.key),
      'tidalcycles:toggle-muteall': () => this.toggleMuteAll(),
      'tidalcycles:hush': () => this.hush()
    });
  }

  start() {
    status.reset()

    this.ghci = this.ghc.interactive()
      .on('stderr', data => { this.processStdErr(data) })
      .on('stdout', data => { this.processStdOut(data) })

    this.initTidal();
  }

  hush() {
    this.tidalSendExpression('hush');
  }

  processStdOut(data) {
    this.stdOut.push(data.toString('utf8'))
    this.processStd()
  }

  processStdErr(data) {
    this.stdErr.push(data.toString('utf8'))
    this.processStd()
  }

  processStd() {
    clearTimeout(this.stdTimer)
    // defers the handler of stdOut/stdErr data
    // by some arbitrary ammount of time (50ms)
    // to get the buffer filled completly
    this.stdTimer = setTimeout(() => {
      this.flushStdErr()
      this.flushStdOut()
    }, 50);
  }

  flushStdOut() {
    if (this.stdOut.length) {
      let output = this.stdOut.join('')
        .trim()
        .replace(/tidal>.*Prelude>/g, "")
        .replace(/tidal>/g, "")
        .replace(/Prelude>/g, "")
        .replace(/Prelude.*\|/g, "")
        .replace(/GHCi.*help/g, "")

      output = this.consolePrompt() + output

      this.consoleView.logStdout(output);
      this.stdOut.length = 0
    }
  }

  flushStdErr() {
    if (this.stdErr.length) {
      let output = this.stdErr.join('')
        .trim()
        .replace(/<interactive>.*error:/g, "")
        .replace(/ \(bound at.*/g, "")

      output = this.consolePrompt() + output

      this.consoleView.logStderr(output);
      this.stdErr.length = 0
      // dont care about stdOut if there are errors
      this.stdOut.length = 0
    }
  }

  consolePrompt() {
    return atom.config.get('tidalcycles.consolePrompt')
      .replace("%ec", status.evalCount())
      .replace("%ts", status.timestamp())
      .replace("%diff", status.diff())
      + "> "
  }

  initTidal() {
    const bootPath = this.bootTidal.choosePath()
    this.consoleView.logStdout(`Load BootTidal.hs from ${bootPath}`)
    this.tidalSendLine(`:script ${bootPath}`)
  }

  tidalSendExpression(expression) {
    this.tidalSendLine(':{');

    expression.split('\n')
      .forEach(line => this.tidalSendLine(line));

    this.tidalSendLine(':}');
  }

  tidalSendLine(command) {
    this.ghci.writeLine(command);
  }

  eval(evalType, copy) {
    if (!Editor.isTidal()) return;

    if (!this.ghci) this.start();
    Editor.currentEvaluations(evalType)
      .filter(eval => eval.expression && eval.range)
      .forEach(eval => {
        status.eval({ characters: eval.expression.length })

        var unflash = Editor.evalFlash(eval.range);
        if (copy) {
          Editor.copyRange(eval.range);
        }

        this.tidalSendExpression(eval.expression);

        if (unflash) {
          unflash('eval-success');
        }
      })
  }

  toggleMute(connection) {
    let connectionRef = connection === '0' ? '10' : connection

    let command = this.mutes[connectionRef]
      ? `unmute ${connectionRef}`
      : `mute ${connectionRef}`

    this.tidalSendLine(command)
    this.consoleView.logStdout(command)
    this.mutes[connectionRef] = !this.mutes[connectionRef]
  }

  toggleMuteAll() {
    let command = this.mutes['all'] ? 'unmuteAll' : 'muteAll'

    this.tidalSendLine(command)
    this.consoleView.logStdout(command)
    this.mutes['all'] = !this.mutes['all']
  }

  destroy() {
    if (this.ghci) {
      this.ghci.destroy();
    }
  }

}
