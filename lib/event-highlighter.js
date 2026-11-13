'use babel'

const path = require('path');

import Tokenizer from './highlighting/tokenizer';
import MarkerStore from './highlighting/marker-store';
import Styles from './highlighting/styles';
import PlayStateProcessor from './highlighting/playstate/process';
import StdoutCollector from './highlighting/playstate/protocol';

export default class EventHighlighter {

  constructor(consoleView, editors) {
    this.consoleView = consoleView;
    this.editors = editors;

    this.styles = new Styles();
    this.markerStore = new MarkerStore(editors, this.styles);

    // playstate engine state
    this.ghci = null;
    this.playstateProcessor = null;
    this.stdoutCollector = null;
  }

  destroy() {
    this.markerStore.wipeAll();
    this.styles.destroy();
    this.ghci = null;
    this.playstateProcessor = null;
    this.stdoutCollector = null;
  }

  addMetadata(line, lineNumber) {
    if (lineNumber === undefined) return line;

    this.markerStore.cleanRowRange(lineNumber, lineNumber);

    return Tokenizer.addMetadata(line, lineNumber, this.markerStore);
  }

  onHush() {
    this.markerStore.wipeAll();
    Tokenizer.reset();
  }

  styleSubscriber() {
    return (args) => {
      if (args.length < 2) return;
      this.styles.addStyle(String(args[0].value), args[1].value);
    };
  }

  oscPingSubscriber() {
    return (args) => {
      const cyclePos = Number(args[7].value);

      if (this.playstateProcessor !== null) {
        this.playstateProcessor.setSam(cyclePos);
        this.playstateProcessor.handleEvents();
      }
    };
  }

  resetSubscriber() {
    return () => {
      if (this.playstateProcessor !== null) {
        this.playstateProcessor.reset();
      }
    };
  }

  detachGhci() {
    this.ghci = null;
    this.playstateProcessor = null;
    this.stdoutCollector = null;
  }

  attachGhci(ghci) {
    this.ghci = ghci;
    this.playstateProcessor = new PlayStateProcessor(this.markerStore, ghci);
    this.stdoutCollector = new StdoutCollector((lines) => this.playstateProcessor.onDataProcessed(lines));

    const playstatePath = path.join(__dirname, 'tidal', 'playstate.hs');
    ghci.writeLine(`:{\n:script "${playstatePath}"\n:}`);

    ghci.writeLine(':set prompt ""');
    ghci.writeLine(':set prompt-cont ""');
  }

  afterSend() {
    if (this.playstateProcessor === null) return;

    this.playstateProcessor.reset();

    const fps = atom.config.get('tidalcycles.eventHighlighting.fps');
    this.ghci.writeLine(`:{\nclock "1*${fps}"\n:}`);
  }

  filterStdout(chunk) {
    if (this.stdoutCollector === null) return chunk;

    return this.stdoutCollector.consume(chunk).join('\n');
  }
}
