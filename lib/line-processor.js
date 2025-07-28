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

           return (
             (code >= digitMin && code <= digitMax) ||
             (code >= upperCaseMin && code <= upperCaseMax) ||
             (code >= lowerCaseMin && code <= lowerCaseMax)
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

		Array.from(line).forEach((char, index) => {
			if (LineProcessor.isQuotationMark(char)) {
				insideQuotes = !insideQuotes;
			} 

			if (insideQuotes && LineProcessor.isValidTidalWordChar(char)) {
			   if (!start) {
				start = index;
				end = index;
			   } else {
				end++;
			   }
			} else {
			  if (start && end) {
				callback({start, end});
				start = null;
				end = null;
			  }
			}
		})		
	}
}
