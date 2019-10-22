'use babel';

const { exec } = require('child_process');

export default class AutocompleteProvider {

  constructor() {
    this.selector = '.source.tidalcycles';
    this.loadSuggestions();
  }

  getSuggestions(options) {
    const { prefix } = options;
    return this.suggestions
      .filter(suggestion => {
        let textLower = suggestion.text.toLowerCase();
        return textLower.startsWith(prefix.toLowerCase());
      });
  }

  loadSuggestions() {
    let ghciPath = atom.config.get('tidalcycles.ghciPath')
    exec(`echo ":browse Sound.Tidal.Context" | ${ghciPath}`, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }

      this.suggestions = this.parse(stdout)
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
        return {
          text: functionPath.substring(functionPath.lastIndexOf('.') + 1),
          description: fields[1].trim(),
          type: 'function',
          rightLabel: functionPath.substring(0, functionPath.lastIndexOf('.')),
        }
      })
  }
}
