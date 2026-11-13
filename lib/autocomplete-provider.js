'use babel';

import SignatureFormatter from './signature-formatter';

export default class AutocompleteProvider {

  constructor(ghc) {
    this.selector = '.source.tidalcycles';
    this.hooglePath = atom.config.get('tidalcycles.hooglePath')
    this.suggestions = []
    this.sigFormatter = new SignatureFormatter();
    if (ghc && atom.config.get('tidalcycles.autocomplete')) {
      ghc.browseTidal(output => {
        this.suggestions = this.parse(output)
      })
    }
    this.disableForSelector = '.comment, .string, .string.quoted, .string.quoted.single, .string.quoted.double';
    this.filterSuggestions = false;
  }

  getSuggestions({editor, bufferPosition}) {
    const prefix = this.getPrefix(editor, bufferPosition);
    if (!prefix) return [];

    const isSymbolic = /[^a-z0-9_]/i.test(prefix);
    const qLower = prefix.toLowerCase();

    return this.suggestions
      .filter(({text}) => !!text)
      .filter(({text}) => isSymbolic ? text.toLowerCase().includes(qLower) : text.toLowerCase().startsWith(qLower))
      .map(s => ({ ...s, replacementPrefix: prefix }));
  }

  getPrefix(editor, bufferPosition) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const mWord = line.match(/[A-Za-z0-9_]+$/);
    if (mWord) return mWord[0];
    const mSym = line.match(/[#|%*+\-\/<>=~:&!^?$@.]+$/);
    if (mSym) return mSym[0];
    return '';
  }

  parse(exportedIdentifiers) {
    if (!exportedIdentifiers) {
      return [];
    }
    let content = exportedIdentifiers;

    // Check if string contains any of the typical type signature identifiers from hoogle
    if (!/( ::|data |class |type |newtype )/.test(content)) {
      return [];
    }

    // Parse and clean output from ghc.browseTidal()
    let functions;
    let parts = content.split(/\n> ([\s\S]*)/);

    if (parts.length < 2) {
      functions = content.split('\n');
    } else {
      functions = parts[1].split('\n');
      functions = functions.slice(0, functions.length - 2);
    }

    functions = functions
      .reduce((acc, cur) => {
        if (cur.startsWith(" ")) {
          return acc + ' ' + cur.trim();
        } else {
          return acc + '\n' + cur.trim();
        }
      }, '')
      .split("\n")
      .filter(line => line.length > 0)
      .filter(line => !line.startsWith(':'))
      .filter(line => !/^[A-Za-z]*>/.test(line));

    let seen = new Set();
    return functions
      .map(row => {
        row = row.trim();
        let formatted = this.sigFormatter.formatTypeSignature(row);

        if (!formatted) {
          return null;
        }

        let [functionPath, typeSignature] = formatted;
        let functionName = functionPath.substring(functionPath.lastIndexOf('.') + 1);

        if (seen.has(functionName)) {
          return null;
        }
        seen.add(functionName);

        // Filter out kind signatures (containing only *, :, ->, =>). There are other definitions for these types.
        if (/^[\s*:>\-=]+$/.test(typeSignature)) {
          return null;
        }

        let docsURL = `https://tidalcycles.org/search?q=${encodeURIComponent(/[A-Za-z0-9]/.test(functionName) ? functionName : (functionName + ' operator'))}`;
        let hoogleURL = `https://hoogle.haskell.org/?hoogle=${encodeURIComponent(functionName)}&scope=package:tidal`;

        return {
          text: functionName,
          snippet: `${functionName} `,
          description: typeSignature,
          type: 'function',
          rightLabel: functionPath.substring(0, functionPath.lastIndexOf('.')),
          descriptionMoreURL: hoogleURL,
          leftLabelHTML: `<a data-docs-link href="${docsURL}" title="Open tidalcycles.org in a browser." tabindex="-1">🔗</a>`
        };
      })
      .filter(item => item !== null);
  }
}