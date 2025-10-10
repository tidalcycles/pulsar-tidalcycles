'use babel';

const child_process = require('child_process')

export default class AutocompleteProvider {

  constructor(ghc) {
    this.selector = '.source.tidalcycles';
    this.hooglePath = atom.config.get('tidalcycles.hooglePath')
    this.suggestions = []
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
      .filter(({text}) => text && (
        isSymbolic ? text.toLowerCase().includes(qLower)
          : text.toLowerCase().startsWith(qLower)
      ))
      .map(s => ({...s, replacementPrefix: prefix}));
  }

  getPrefix(editor, bufferPosition) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const mWord = line.match(/[A-Za-z0-9_]+$/);
    if (mWord) return mWord[0];
    const mSym = line.match(/[#|%*+\-\/<>=~:&!^?$@.]+$/);
    return mSym ? mSym[0] : '';
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

  formatTypeSignatureArrows(sig) {
    let parenDepth = 0;
    let bracketDepth = 0;
    let i = 0;
    let output = "";

    const needNewline = () => output.length === 0 || !/\r?\n$/.test(output);

    while (i < sig.length) {
      const ch = sig[i];
      const next = sig[i + 1];

      // Track grouping depth
      if (ch === "(") {
        parenDepth++;
        output += ch;
        i++;
        continue;
      }
      if (ch === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        output += ch;
        i++;
        continue;
      }
      if (ch === "[") {
        bracketDepth++;
        output += ch;
        i++;
        continue;
      }
      if (ch === "]") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        output += ch;
        i++;
        continue;
      }

      const atTopLevel = (parenDepth === 0 && bracketDepth === 0);

      if (atTopLevel) {
        // '=>'
        if (ch === "=" && next === ">") {
          if (needNewline()) output += "\n";
          output += "  =>";
          i += 2;
          continue;
        }
        // '->'
        if (ch === "-" && next === ">") {
          if (needNewline()) output += "\n";
          output += "  ->";
          i += 2;
          continue;
        }
        // single '|'
        if (ch === "|" && next !== "|") {
          if (needNewline()) output += "\n";
          output += "  |";
          i += 1;
          continue;
        }
        // single '=' (e.g. not '==' and not '=>')
        if (ch === "=" && next !== "=") {
          if (needNewline()) output += "\n";
          output += "  =";
          i += 1;
          continue;
        }
      }
      output += ch;
      i++;
    }

    return output.trim();
  }


  formatTypeSignature(row) {
    let [funcPath, typeSig] = ['', ''];

    //Handle different Haskell type signatures
    if (row.startsWith('data ') || row.startsWith('class ') || row.startsWith('type ') || row.startsWith('newtype ')) {
      if (row.includes(' where ')) {
        [funcPath, typeSig] = row.split(/ where ([\s\S]*)/);
        typeSig = 'where ' + typeSig.trim();
      } else if (row.includes(' = ')) {
        [funcPath, typeSig] = row.split(/ = ([\s\S]*)/);
        typeSig = '= ' + typeSig.trim();
      } else if (row.includes(' ::')) {
        [funcPath, typeSig = ""] = row.split(/ ::([\s\S]*)/);
        typeSig = ':: ' + typeSig.trim();
      } else {
        return null;
      }
    } else if (row.includes(' ::')) {
      [funcPath, typeSig = ""] = row.split(/ ::([\s\S]*)/);
      typeSig = ':: ' + typeSig.trim();
    } else {
      return null;
    }

    funcPath = funcPath.replace(/[()]/g, '')
    typeSig = typeSig.trim().replace('\n', '').replace(/\bSound\.Tidal\.[A-Za-z_][\w']*\./g, '');
    typeSig = this.formatTypeSignatureArrows(typeSig);

    return [funcPath, typeSig];
  }

  parse(exportedIdentifiers) {
    let content = exportedIdentifiers || '';

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
      .filter(line => line.length > 0);

    return functions
      .map(row => {
        row = row.trim();

        let formatted = this.formatTypeSignature(row);

        if (!formatted) {
          return null;
        }

        let [functionPath, typeSignature] = formatted;
        let functionName = functionPath.substring(functionPath.lastIndexOf('.') + 1);
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