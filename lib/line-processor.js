'use babel'

export default class LineProcessor {
  // private static constants
  static #DIGIT_MIN = 48;
  static #DIGIT_MAX = 57;
  static #UPPERCASE_MIN = 65;
  static #UPPERCASE_MAX = 90;
  static #LOWERCASE_MIN = 97;
  static #LOWERCASE_MAX = 122;
  static #DOT = 46;
  static #MINUS = 45;
  static #COLON = 58;
  static #QUOTATION_MARK = 34;

  // Valid TidalCycles word chars
  static isValidTidalWordChar(character) {
    const code = character.charCodeAt(0);

    return (
      (code >= LineProcessor.#DIGIT_MIN && code <= LineProcessor.#DIGIT_MAX) ||
      (code >= LineProcessor.#UPPERCASE_MIN && code <= LineProcessor.#UPPERCASE_MAX) ||
      (code >= LineProcessor.#LOWERCASE_MIN && code <= LineProcessor.#LOWERCASE_MAX) ||
      (code === LineProcessor.#DOT) ||
      (code === LineProcessor.#MINUS) ||
      (code === LineProcessor.#COLON)
    );
  }

  static isQuotationMark(character) {
    return character.charCodeAt(0) === LineProcessor.#QUOTATION_MARK;
  }

  static findTidalWordRanges(line, callback) {
    let insideQuotes = false;
    let start = null;
    let end = null;

    Array.from(line).forEach((char, index) => {
      if (LineProcessor.isQuotationMark(char)) {
        insideQuotes = !insideQuotes;
      }

      if (insideQuotes && LineProcessor.isValidTidalWordChar(char)) {
        if (start === null) {
          start = index;
          end = index;
        } else {
          end++;
        }
      } else {
        if (start !== null && end !== null) {
          callback({ start, end });
          start = null;
          end = null;
        }
      }
    });
  }

  static controlPatternsRegex() {
    return /"([^"]*)"/g;
  }

  static exceptedFunctionPatterns() {
    return /numerals\s*=.*$|p\s.*$/;
  }
}

