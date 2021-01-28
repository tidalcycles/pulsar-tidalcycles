'use babel';

export default class REPL {

  ghci = null
  consoleView = null
  stdErr = null
  stdOut = null
  stdTimer = 0

  constructor(consoleView, ghc, bootTidal, status, editor) {
    this.consoleView = consoleView;
    this.stdErr = []
    this.stdOut = []
    this.ghc = ghc
    this.bootTidal = bootTidal
    this.status = status
    this.editor = editor

    this.mutes = [...Array(10).keys()]
      .reduce((acc, cur) => {
        acc[`${cur+1}`] = false
        return acc;
      }, {});
    this.mutes['all'] = false
  }

  start() {
    this.status.reset()

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

      this.consoleView.logPromptOut(output);
      this.stdOut.length = 0
    }
  }

  flushStdErr() {
    if (this.stdErr.length) {
      let output = this.stdErr.join('')
        .trim()
        .replace(/<interactive>.*error:/g, "")
        .replace(/ \(bound at.*/g, "")

      this.consoleView.logPromptErr(output);
      this.stdErr.length = 0
      // dont care about stdOut if there are errors
      this.stdOut.length = 0
    }
  }

  initTidal() {
    let tidalPackageVersion = this.ghc.tidalPackageVersion()
    if (tidalPackageVersion) {
      this.consoleView.logStdout(`Tidal package: ${tidalPackageVersion}`)
    }

    const bootPath = this.bootTidal.choosePath()
    this.consoleView.logStdout(`Load BootTidal.hs from ${bootPath}`)
    
    if (bootPath.indexOf(' ') === -1) {
      this.tidalSendLine(`:script ${bootPath}`)
    } else {
      this.bootTidal.blocks()
      .forEach(block => block.indexOf('\n') === -1
        ? this.tidalSendLine(block)
        : this.tidalSendExpression(block)
      )
    }
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
    if (!this.editor.isTidal()) return;

    if (!this.ghci) this.start();
    this.editor.currentEvaluations(evalType)
      .filter(eval => eval.expression && eval.range)
      .forEach(eval => {
        this.status.eval({ characters: eval.expression.length })

        var unflash = this.editor.evalFlash(eval.range);
        if (copy) {
          this.editor.copyRange(eval.range);
        }

        this.tidalSendExpression(eval.expression);

        if (unflash) {
          unflash('eval-success');
        }
      })
  }

  toggleMute(connection) {
    let connectionRef = connection === '0' ? '10' : connection

    let command = connectionRef === 'all'
      ? this.mutes['all'] ? 'unmuteAll' : 'muteAll'
      : this.mutes[connectionRef] ? `unmute ${connectionRef}` : `mute ${connectionRef}`

    this.tidalSendLine(command)
    this.mutes[connectionRef] = !this.mutes[connectionRef]
    this.consoleView.logMutes(this.mutes, command)
  }

  destroy() {
    if (this.ghci) {
      this.ghci.destroy();
    }
  }

}
