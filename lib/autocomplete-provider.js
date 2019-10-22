'use babel';

const TidalCycles = require('./tidalcycles')
const { exec } = require('child_process');

export default class AutocompleteProvider {

  constructor() {
    this.selector = '.source.tidalcycles';
    this.readAutocompleteSuggestions();
  }

  getSuggestions(options) {
    const { prefix } = options;
    return this.findMatchingSuggestions(prefix);
  }

  findMatchingSuggestions(prefix) {
    // filter list of suggestions to those matching the prefix, case insensitive
    let prefixLower = prefix.toLowerCase();
    console.log(`autocomplete suggestions: ${this.autocompleteSuggestions.length}`)
    let matchingSuggestions = this.autocompleteSuggestions.filter((suggestion) => {
      let textLower = suggestion.text.toLowerCase();
      return textLower.startsWith(prefixLower);
    });

    // run each matching suggestion through inflateSuggestion() and return
    return matchingSuggestions.map(this.inflateSuggestion);
  }

  dispose() {
    if (this.ghci) this.ghci.kill()
  }

  inflateSuggestion(suggestion) {
    return {
      text: suggestion.text,
      description: suggestion.description,
      descriptionMoreURL: suggestion.descriptionMoreURL,
      type: 'value',
      rightLabel: suggestion.rightLabel,
    };
  }

  readAutocompleteSuggestions() {
    let ghciPath = atom.config.get('tidalcycles.ghciPath')
    exec(`echo ":browse Sound.Tidal.Context" | ${ghciPath}`, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }

      let functions = stdout
        .split("\n")
        .reduce((acc, cur) => cur.startsWith(" ")
          ? acc + cur
          : acc + '\n' + cur, "")

      this.autocompleteSuggestions = []

      functions
        .split("\n")
        .filter(row => row.indexOf(' :: ') > -1)
        .map(row => {
          // console.log(row)
          return row
        })
        .map(row => {
          let fields = row.split(' :: ')
          let functionPath = fields[0].replace("(", "").replace(")", "")
          return {
            text: functionPath.substring(functionPath.lastIndexOf('.') + 1),
            description: fields[1],
            rightLabel: functionPath.substring(0, functionPath.lastIndexOf('.')),
          }
        })
        .forEach(suggestion => {
          this.autocompleteSuggestions.push(suggestion)
        })
    })
  }
}
