'use babel'

export default class LineProcessor {

  // Valid TidalCycles word chars
  static isValidTidalWordChar(character) {
    const code = character.charCodeAt(0);
    // 0-9
    const digitMin = 48;
    const digitMax = 57;
    // A-Z
    const upperCaseMin = 65;
    const upperCaseMax = 90;
    // a-z
    const lowerCaseMin = 97;
    const lowerCaseMax = 122;
    // .
    const dot = 46;
    // -
    const minus = 45;
    // :
    const colon = 58;

    return (
      (code >= digitMin && code <= digitMax) ||
      (code >= upperCaseMin && code <= upperCaseMax) ||
      (code >= lowerCaseMin && code <= lowerCaseMax) ||
      code === dot ||
      code === minus ||
      code === colon
    );
  }

  static isQuotationMark(character) {
    const code = character.charCodeAt(0);
    // "
    const quotationMark = 34;

    return code === quotationMark;
  }

  static findTidalWordRanges(line, callback) {
    let insideQuotes = false;
    let start = null;
    let end = null;
    let lastIdentifier = null;
    let currIdent = null;
    let funcName = null;
    let quoteIndex = 0;

    for (let index = 0; index < line.length; index++) {
      const char = line[index];

      if (LineProcessor.isQuotationMark(char)) {
        if (currIdent !== null) {
          lastIdentifier = currIdent;
          currIdent = null;
        }

        if (!insideQuotes) {
          funcName = lastIdentifier;
          quoteIndex++;
        }

        insideQuotes = !insideQuotes;

        // closing quote: flush any last tidal word
        if (!insideQuotes && start !== null && end !== null) {
          callback({ start, end, functionName: funcName || "", quoteIndex });
          start = null;
          end = null;
        }
      } else if (insideQuotes) {
        if (LineProcessor.isValidTidalWordChar(char)) {
          if (start === null) {
            start = index;
            end = index;
          } else {
            end = index;
          }
        } else if (start !== null && end !== null) {
          callback({ start, end, functionName: funcName || "", quoteIndex });
          start = null;
          end = null;
        }
      } else {
        // outside quotes: track last identifier (function name)
        if (currIdent === null) {
          if (/[a-zA-Z_]/.test(char)) {
            currIdent = char;
          }
        } else {
          if (/[a-zA-Z0-9_]/.test(char)) {
            currIdent = currIdent + char;
          } else {
            lastIdentifier = currIdent;
            currIdent = null;
          }
        }
      }
    }

    // flush any open word at end of line (unclosed quotes)
    if (start !== null && end !== null) {
      callback({ start, end, functionName: funcName || "", quoteIndex });
    }
  }

  static controlPatternsRegex() {
    return new RegExp(/"([^"]*)"/g);
  }

  static exceptedFunctionPatterns() {
    return new RegExp(/numerals\s*=.*$|p\s.*$/);
  }
}
