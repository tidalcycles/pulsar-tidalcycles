'use babel';

const dgram = require('dgram');
const osc = require('osc-min');
const Process = require('./process');
const Pattern = require('./pattern');
import { Range } from 'atom'

export default class TidalListenerRepl {

  consoleView = null

  constructor(consoleView, status, editors) {
    this.consoleView = consoleView;
    this.status = status
    this.editors = editors
    this.stdOut = []
    this.stdErr = []
    this.highlights = {}
    this.patterns = {}

    this.mutes = [...Array(16).keys()]
      .reduce((acc, cur) => {
        acc[`${cur+1}`] = false
        return acc;
      }, {});

  }

  start() {
    this.status.reset()

    this.listener = Process.tidalListener();
    this.listener.on('stderr', data => this.consoleView.logStderr(data));
    this.listener.on('stdout', data => this.consoleView.logStdlog(data))

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
          this.highlight(resultMap.args)
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

  tidalSendExpression(expression, id) {
    var buf = osc.toBuffer({
      address: "/code",
      args: [id, expression]
    });

    this.udp.send(buf, 0, buf.length, 6011, "localhost");

  }

  eval(evalType, copy) {
    if (!this.editors.currentIsTidal()) return;

    if (!this.listener) this.start();
    // TODO: it's correct that an eval with listener should eval everything?
    Object.values(this.patterns).forEach(pattern => pattern.destroy())
    this.editors.currentEvaluations()
      .filter(e => e.expression && e.range)
      .map(e => new Pattern(e.id, e.expression, e.range, this.editors.currentEditor()))
      .forEach(pattern => {
        this.patterns[pattern.id] = pattern

        this.status.eval({ characters: pattern.expression.length })

        var unflash = this.editors.evalFlash(pattern.range);
        if (copy) {
          this.editors.copyRange(pattern.range);
        }

        this.tidalSendExpression(pattern.expression, pattern.id);

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

  highlight(args) {
    let id = args[0].value
    let duration = args[1].value
    let cyclePosition = args[2].value
    let startColumn = args[3].value
    let startRow = args[4].value - 1
    let stopColumn = args[5].value
    let stopRow = args[6].value - 1

    let pattern = this.patterns[id]
    if (pattern) {
      pattern.addHighlight(cyclePosition, new Range([startRow, startColumn], [stopRow, stopColumn]))
    }

  }

  destroy() {
    if (this.listener) {
      this.listener.destroy();
    }
    if (this.udp) {
      this.udp.close();
    }
    this.listener = undefined;
    this.udp = undefined;
  }

}
