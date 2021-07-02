'use babel';

const dgram = require('dgram');
const osc = require('osc-min');
const child_process = require('child_process');

export default class Repl {

  consoleView = null

  constructor(consoleView, status, editor) {
    this.consoleView = consoleView;
    this.status = status
    this.editor = editor
    this.stdOut = []
    this.stdErr = []

    this.mutes = [...Array(16).keys()]
      .reduce((acc, cur) => {
        acc[`${cur+1}`] = false
        return acc;
      }, {});
  }

  start() {
    this.status.reset()

    this.listener = child_process.spawn('tidal-listener', []);
    this.listener.stderr.on('data', data => {
      this.stdErr.push(data.toString('utf8'))
      setTimeout(() => {
        if (this.stdErr.length) {
          let err = this.stdErr.join('')
          this.stdErr.length = 0;
          this.consoleView.logStderr(err)
        }
      }, 50)
    });
    this.listener.stdout.on('data', data => {
      this.stdOut.push(data.toString('utf8'))
      setTimeout(() => {
        if (this.stdOut.length) {
          let log = this.stdOut.join('')
          this.stdOut.length = 0
          this.consoleView.logStdlog(log)
        }
      }, 50)
    });

    this.udp = dgram.createSocket('udp4');

    this.udp.on('message', (msg) => {
      let resultMap = osc.fromBuffer(msg);

      switch (resultMap.address) {
        case '/code/ok':
          this.consoleView.logPromptOut('')
          break;
        case '/code/error':
          let id = resultMap.args[0].value;
          let message = resultMap.args[1].value;
          this.consoleView.logPromptErr(message);
          break;
        case '/code/highlight':
          // TODO: handle code highlight
          break;
        case '/dirt/handshake':
          this.consoleView.logPromptErr(`Waiting for SuperDirt`);
          break;
        default:
          this.consoleView.logPromptOut(`Received an unknown message: ${resultMap.address}`)
      }
    });

    this.udp.on('error', (err) => {
       this.consoleView.logPromptErr(`tidal-listener error: \n${err.stack}`)
       this.udp.close();
    });

    this.udp.on('listening', () => {
        this.consoleView.logPromptOut(`Listening for tidal-listener responses `)
    });

    this.udp.bind(6012, this.ip);
  }

  hush() {
    this.tidalSendExpression('hush');
  }

  tidalSendExpression(expression) {
    var buf = osc.toBuffer({
      address: "/code",
      args: ["ident", expression] // TODO: ident should be an id
    });

    this.udp.send(buf, 0, buf.length, 6011, "localhost");

  }

  eval(evalType, copy) {
    if (!this.editor.isTidal()) return;

    if (!this.listener || this.listener.killed) this.start();
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
    let command = this.mutes[connection]
      ? `unmute ${connection}`
      : `mute ${connection}`

    this.tidalSendExpression(command)

    this.mutes[connection] = !this.mutes[connection]
    this.consoleView.logMutes(this.mutes, command)
  }

  unmuteAll() {
    let command = 'unmuteAll'

    this.tidalSendExpression(command)

    for (key of Object.keys(this.mutes)) {
      this.mutes[key] = false
    }
    this.consoleView.logMutes(this.mutes, command)
  }

  destroy() {
    if (this.listener) {
      this.listener.kill();
    }
    if (this.udp) {
      this.udp.close();
    }
  }

}
