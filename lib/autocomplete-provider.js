'use babel';

const child_process = require('child_process')
const Ghc = require('./ghc');

export default class AutocompleteProvider {

  constructor(ghc) {
    this.selector = '.source.tidalcycles';
    this.hooglePath = atom.config.get('tidalcycles.hooglePath')
    this.suggestions = []
    if (atom.config.get('tidalcycles.autocomplete')) {
      ghc.browseTidal(output => {
        this.suggestions = this.parse(output)
      })
    }
  }

  getSuggestions(options) {
    const { prefix } = options;
    return this.suggestions
      .filter(suggestion => {
        let textLower = suggestion.text.toLowerCase();
        return textLower.startsWith(prefix.toLowerCase());
      });
  }

  getSuggestionDetailsOnSelect(suggestion) {
    return new Promise((resolve, _) => {
      try {
        let documentation = child_process
          .execSync(`${this.hooglePath} -i "${suggestion.rightLabel}.${suggestion.text}"`)
          .toString().trim()

        if (documentation !== 'No results found') {
          suggestion.description = documentation
        }
        resolve(suggestion)
      } catch (err) {
        resolve(suggestion)
      }
    })
  }

  parse(exportedIdentifiers) {
    let functions = exportedIdentifiers
      .split("\n")
      .reduce((acc, cur) =>
        cur.startsWith(" ")
          ? acc + ' ' + cur.trim()
          : acc + '\n' + cur
      )

    return functions
      .split("\n")
      .filter(row => row.indexOf('::') > -1)
      .map(row => {
        let fields = row.split('::')
        let functionPath = fields[0].trim().replace("(", "").replace(")", "")
        let functionName = functionPath.substring(functionPath.lastIndexOf('.') + 1)
        return {
          text: functionPath.substring(functionPath.lastIndexOf('.') + 1),
          snippet: `${functionName} `,
          description: fields[1].trim(),
          type: 'function',
          rightLabel: functionPath.substring(0, functionPath.lastIndexOf('.')),
        }
      })
  }
}
