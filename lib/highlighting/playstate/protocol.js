'use babel'

export class StdoutCollector {

  constructor(onDataProcessed) {
    this.buffer = "";
    this.locked = false;
    this.lockedLines = [];
    this.onDataProcessed = onDataProcessed;
  }

  consume(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    let complete;

    if (this.buffer.endsWith('\n')) {
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      complete = lines;
      this.buffer = "";
    } else {
      const remainder = lines.pop();
      complete = lines;
      this.buffer = remainder;
    }

    const logLines = [];
    for (const line of complete) {
      if (line.endsWith('_START')) {
        this.locked = true;
        this.lockedLines = [line];
        continue;
      }

      if (this.locked) {
        this.lockedLines.push(line);

        if (line.endsWith('_END')) {
          this.onDataProcessed(this.lockedLines);
          this.lockedLines = [];
          this.locked = false;
        }
      } else {
        logLines.push(line);
      }
    }

    return logLines;
  }
}

export default StdoutCollector;
