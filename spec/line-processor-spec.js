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

    describe('isQuotationMark', () => {
        it('should find the range for one ControlPattern and one word and execute the callback once', ()  => {
            const results = [];
            LineProcessor.findTidalWordRanges(
            	`d1 $ s "superpiano" # note 0`, 
            	(result) => results.push(result));

            expect(results.length).toEqual(1);
            expect(results[0]).toEqual({ start: 8, end: 17});
        })

        it('should find the range for two ControlPatterns and several words and execute the callback accorgingly', ()  => {
            const results = [];
            LineProcessor.findTidalWordRanges(
            	`d1 $ s "<superpiano 808>" # note "0"`, 
            	(result) => results.push(result));

            expect(results.length).toEqual(3);
            expect(results[0]).toEqual({ start: 9, end: 18});
            expect(results[1]).toEqual({ start: 20, end: 22});
            expect(results[2]).toEqual({ start: 34, end: 34});
        })


        it('should find the range for one relatively complex ControlPattern and several words and execute the callback accordingly', ()  => {
            const results = [];
            LineProcessor.findTidalWordRanges(
            	`d1 $ s "superpiano" # note "c'maj'4*<1 2 3>"`, 
            	(result) => results.push(result));

            expect(results.length).toEqual(7);
            expect(results[0]).toEqual({ start: 8, end: 17});
            expect(results[1]).toEqual({ start: 28, end: 28});
            expect(results[2]).toEqual({ start: 30, end: 32});
            expect(results[3]).toEqual({ start: 34, end: 34});
            expect(results[4]).toEqual({ start: 37, end: 37});
            expect(results[5]).toEqual({ start: 39, end: 39});
            expect(results[6]).toEqual({ start: 41, end: 41});
        })
    })
})
