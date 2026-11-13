const LineProcessor = require("../lib/line-processor");

describe('Line Processor', () => {

  describe('isValidTidalWordChar', () => {
    it('should truthify a valid digit', () => {
      expect(LineProcessor.isValidTidalWordChar('5')).toBe(true);
    })
    it('should truthify a valid upper case char', () => {
      expect(LineProcessor.isValidTidalWordChar('M')).toBe(true);
    })

    it('should truthify a valid lower case char', () => {
      expect(LineProcessor.isValidTidalWordChar('t')).toBe(true);
    })

    it('should truthify a dot', () => {
      expect(LineProcessor.isValidTidalWordChar('.')).toBe(true);
    })

    it('should truthify a minus', () => {
      expect(LineProcessor.isValidTidalWordChar('-')).toBe(true);
    })

    it('should truthify a colon', () => {
      expect(LineProcessor.isValidTidalWordChar(':')).toBe(true);
    })

    it('should falsify an invalid char', () => {
      expect(LineProcessor.isValidTidalWordChar('*')).toBe(false);
    })
  })

  describe('isQuotationMark', () => {
    it('should truthify quotation mark', () => {
      expect(LineProcessor.isQuotationMark('"')).toBe(true);
    })

    it('should falsify non quotation mark', () => {
      expect(LineProcessor.isQuotationMark('*')).toBe(false);
    })
  })

  describe('findTidalWordRanges', () => {
    it('should find the range for one ControlPattern and one word and execute the callback once', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `d1 $ s "superpiano" # note 0`,
        (result) => results.push(result));

      expect(results.length).toEqual(1);
      expect(results[0]).toEqual({ start: 8, end: 17, functionName: 's', quoteIndex: 1 });
    })

    it('should find the range for two ControlPatterns and several words and execute the callback accordingly', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `d1 $ s "<superpiano 808>" # note "0"`,
        (result) => results.push(result));

      expect(results.length).toEqual(3);
      expect(results[0]).toEqual({ start: 9, end: 18, functionName: 's', quoteIndex: 1 });
      expect(results[1]).toEqual({ start: 20, end: 22, functionName: 's', quoteIndex: 1 });
      expect(results[2]).toEqual({ start: 34, end: 34, functionName: 'note', quoteIndex: 2 });
    })

    it('should find the range for one relatively complex ControlPattern and several words and execute the callback accordingly', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `d1 $ s "superpiano" # note "c'maj'4*<1 2 3>"`,
        (result) => results.push(result));

      expect(results.length).toEqual(7);
      expect(results[0]).toEqual({ start: 8, end: 17, functionName: 's', quoteIndex: 1 });
      expect(results[1]).toEqual({ start: 28, end: 28, functionName: 'note', quoteIndex: 2 });
      expect(results[2]).toEqual({ start: 30, end: 32, functionName: 'note', quoteIndex: 2 });
      expect(results[3]).toEqual({ start: 34, end: 34, functionName: 'note', quoteIndex: 2 });
      expect(results[4]).toEqual({ start: 37, end: 37, functionName: 'note', quoteIndex: 2 });
      expect(results[5]).toEqual({ start: 39, end: 39, functionName: 'note', quoteIndex: 2 });
      expect(results[6]).toEqual({ start: 41, end: 41, functionName: 'note', quoteIndex: 2 });
    })

    it('should keep fractional, negative and time tokens as one word each', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `s "1.5 -3 bd:2"`,
        (result) => results.push(result));

      expect(results.length).toEqual(3);
      expect(results[0]).toEqual({ start: 3, end: 5, functionName: 's', quoteIndex: 1 });
      expect(results[1]).toEqual({ start: 7, end: 8, functionName: 's', quoteIndex: 1 });
      expect(results[2]).toEqual({ start: 10, end: 13, functionName: 's', quoteIndex: 1 });
    })

    it('should flush a token that reaches the end of an unclosed quote', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `d1 $ s "bd`,
        (result) => results.push(result));

      expect(results.length).toEqual(1);
      expect(results[0]).toEqual({ start: 8, end: 9, functionName: 's', quoteIndex: 1 });
    })

    it('should ignore characters outside quotes', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `d1 $ sound [bd]`,
        (result) => results.push(result));

      expect(results.length).toEqual(0);
    })

    it('should increment the quote index per quote block', () => {
      const results = [];
      LineProcessor.findTidalWordRanges(
        `d1 $ s "a" # note "b"`,
        (result) => results.push(result));

      expect(results.length).toEqual(2);
      expect(results[0]).toEqual({ start: 8, end: 8, functionName: 's', quoteIndex: 1 });
      expect(results[1]).toEqual({ start: 19, end: 19, functionName: 'note', quoteIndex: 2 });
    })
  })

  describe('controlPatternsRegex', () => {
    it('should match all strings and their quotation marks in a line', () => {
      const testString = `d1 $ s "<superpiano 808>" # note "0"`;
      const expected = [`"<superpiano 808>"`, `"0"`];

      expect(testString.match(LineProcessor.controlPatternsRegex())).toEqual(expected);
    })
  })

  describe('exceptedFunctionPatterns', () => {
    it('should match numerals function occurance in a line', () => {
      const testString = `numerals = "0 1 2 3"`;
      const expected = 'numerals = "0 1 2 3"';
      expect(testString.match(LineProcessor.exceptedFunctionPatterns())[0]).toEqual(expected);
    })

    it('should match p function occurance in a line', () => {
      const testString = `p "hello" $ s "808"`;
      const expected = 'p "hello" $ s "808"';

      expect(testString.match(LineProcessor.exceptedFunctionPatterns())[0]).toEqual(expected);
    })

    it('should not match an allowed control pattern in a line', () => {
      const testString = `d1 $ s "superpiano"`;
      expect(testString.match(LineProcessor.exceptedFunctionPatterns())).toBeNull()
    })
  })
})
