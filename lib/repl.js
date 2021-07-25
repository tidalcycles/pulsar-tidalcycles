'use babel';

export default class REPL {

  ghci = null
  consoleView = null

  constructor(consoleView, ghc, bootTidal, status, editors) {
    this.consoleView = consoleView;
    this.ghc = ghc
    this.bootTidal = bootTidal
    this.status = status
    this.editors = editors

    this.mutes = [...Array(16).keys()]
      .reduce((acc, cur) => {
        acc[`${cur+1}`] = false
        return acc;
      }, {});
  }

  start() {
    this.status.reset()

    this.ghci = this.ghc.interactive()
      .on('stderr', data => this.consoleView.logPromptErr(this.cleanStdErr(data)))
      .on('stdout', data => this.consoleView.logPromptOut(this.cleanStdOut(data)))

    this.initTidal();
  }

  initTidal() {
    const bootPath = this.bootTidal.choosePath()
    this.consoleView.appendLog(` * load BootTidal.hs from ${bootPath}`)
    this.consoleView.flushLog()

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

  hush() {
    this.tidalSendExpression('hush');
  }

  cleanStdOut(stdout) {
    return stdout
      .trim()
      .replace(/tidal>.*Prelude>/g, "")
      .replace(/tidal>/g, "")
      .replace(/Prelude>/g, "")
      .replace(/Prelude.*\|/g, "")
      .replace(/GHCi.*help/g, "")
  }

  cleanStdErr(stderr) {
    return stderr
      .replace(/<interactive>.*error:/g, "")
      .replace(/ \(bound at.*/g, "")
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
    if (!this.editors.currentIsTidal()) return;

    if (!this.ghci) this.start();
    this.editors.currentEvaluations(evalType)
      .filter(eval => eval.expression && eval.range)
      .forEach(eval => {
        this.status.eval({ characters: eval.expression.length })

        var unflash = this.editors.evalFlash(eval.range);
        if (copy) {
          this.editors.copyRange(eval.range);
        }

        this.tidalSendExpression(eval.expression);

        if (unflash) {
          unflash('eval-success');
        }
      })
  }

  toggleMute(connection) {
    let command = this.mutes[connection]
      ? `unmute ${connection}`
      : `mute ${connection}`

    this.tidalSendLine(command)

    this.mutes[connection] = !this.mutes[connection]
    this.consoleView.logMutes(this.mutes, command)
  }

  unmuteAll() {
    let command = 'unmuteAll'

    this.tidalSendLine(command)

    for (key of Object.keys(this.mutes)) {
      this.mutes[key] = false
    }
    this.consoleView.logMutes(this.mutes, command)
  }

  destroy() {
    if (this.ghci) {
      this.ghci.destroy();
    }
  }

}
