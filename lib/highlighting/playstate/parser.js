'use babel'

const ctxRegex = /\((\d+),(\d+)\)/g;

export class PlayStateParser {

  static mapCtx(str) {
    const result = [];
    let match;
    while ((match = ctxRegex.exec(str)) !== null) {
      result.push([parseInt(match[1], 10), parseInt(match[2], 10)]);
    }
    return result;
  }

  static genEventId() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 9; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  static mapEvent(plain) {
    const result = {};

    const idMatch = plain.match(/^([^,]+),/);
    const id = idMatch ? idMatch[1] : undefined;

    const plainCtxMatch = plain.match(/\[([^\]]*)\]/);
    if (!plainCtxMatch) {
      return [undefined, undefined];
    }
    const plainCtx = plainCtxMatch[1];

    const ctxs = PlayStateParser.mapCtx(`[${plainCtx}]`);

    const afterEventsMatch = plain.match(/\]\s*,(.*)/);
    const numbers = [];
    if (afterEventsMatch) {
      for (const num of afterEventsMatch[1].split(',')) {
        if (num) numbers.push(num);
      }
    }

    const startNum = Number(numbers[0]) || 0;
    const startDen = Number(numbers[1]) || 1;
    const stopNum = Number(numbers[2]) || 0;
    const stopDen = Number(numbers[3]) || 1;
    const noteNum = Number(numbers[4]) || 0;
    const noteDen = Number(numbers[5]) || 1;
    const sound = String(numbers[6] !== undefined ? numbers[6] : "");

    const wholeStart = startNum / startDen;
    const wholeStop = stopNum / stopDen;
    const note = noteNum / noteDen;

    const event = {
      id,
      whole: { start: wholeStart, stop: wholeStop },
      note,
      sound,
    };

    for (const ctx of ctxs) {
      const eventKey = PlayStateParser.genEventId();
      result[eventKey] = {
        id,
        eventId: ctx[1] - 1,
        colStart: ctx[0],
        whole: { start: wholeStart, stop: wholeStop },
      };
    }

    return [event, result];
  }

  static parse(line) {
    return PlayStateParser.mapEvent(line);
  }
}

export default PlayStateParser;
