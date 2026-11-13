'use babel'

import LineProcessor from '../line-processor';

export default class Tokenizer {

  static eventIdBase = 0;
  static lastEventId = 0;

  static reset() {
    this.lastEventId = this.eventIdBase;
  }

  static addMetadata(line, lineNumber, markerStore) {
    const replacements = [];
    LineProcessor.findTidalWordRanges(line, (replacement) => replacements.push(replacement));

    if (replacements.length > 0) {
      this.lastEventId = this.lastEventId + 1;
      if (markerStore) {
        markerStore.createMarkers(replacements, lineNumber, this.lastEventId);
      }

      return Tokenizer.addDeltaContext(line, this.lastEventId);
    }

    return line;
  }

  static addDeltaContext(line, eventId) {
    if (line.startsWith(':')) {
      return line;
    }

    return line.replace(LineProcessor.controlPatternsRegex(), (match, content, offset) => {
      const before = line.slice(0, offset);

      if (LineProcessor.exceptedFunctionPatterns().test(before)) {
        return match;
      }

      return `(deltaContext ${offset} ${eventId} "${content}")`;
    });
  }
}
