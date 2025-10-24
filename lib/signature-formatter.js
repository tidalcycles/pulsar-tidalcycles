'use babel';

export default class SignatureFormatter {
  formatTypeSignature(row) {
    let funcPath, typeSig;

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

    funcPath = funcPath.replace(/[()]/g, '');
    typeSig = typeSig.trim().replace('\n', '').replace(/\bSound\.Tidal\.[A-Za-z_][\w']*\./g, '');
    typeSig = formatTypeSignatureArrows(typeSig);

    return [funcPath, typeSig];
  }
}

function formatTypeSignatureArrows(sig) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let i = 0;
  let output = "";
  const hasPipes = /\|(?!\|)/.test(sig);

  const needNewline = () => output.length === 0 || !/\r?\n\s*$/.test(output);

  while (i < sig.length) {
    const ch = sig[i];
    const next = sig[i + 1];
    const prev = sig[i - 1];

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
    if (ch === "{") {
      braceDepth++;
      output += ch;
      if (!hasPipes && braceDepth === 1 && parenDepth === 0 && bracketDepth === 0) {
        if (needNewline()) output += "\n";
        output += "  ";
        while (i + 1 < sig.length && /\s/.test(sig[i + 1])) {
          i++;
        }
      }
      i++;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      if (!hasPipes && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        output = output.replace(/\s+$/, '');
        if (needNewline()) output += "\n";
        output += "  }";
        i++;
        continue;
      }
      output += ch;
      i++;
      continue;
    }

    const atTopLevel = (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0);
    const insideBracesTopLevel = (braceDepth > 0 && parenDepth === 0 && bracketDepth === 0);

    if (!hasPipes && insideBracesTopLevel && ch === ",") {
      output += ",";
      if (needNewline()) output += "\n";
      output += "  ";
      while (i + 1 < sig.length && /\s/.test(sig[i + 1])) {
        i++;
      }
      i++;
      continue;
    }

    if (atTopLevel) {
      if (ch === "=" && next === ">") {
        if (needNewline()) {
          output += "\n  =>";
        } else {
          output = output.replace(/\n\s*$/, '\n  =>');
        }
        i += 2;
        continue;
      }
      if (ch === "-" && next === ">") {
        if (needNewline()) {
          output += "\n  ->";
        } else {
          output = output.replace(/\n\s*$/, '\n  ->');
        }
        i += 2;
        continue;
      }
      if (ch === "|" && next !== "|" && prev !== "|") {
        if (needNewline()) {
          output += "\n  |";
        } else {
          output = output.replace(/\n\s*$/, '\n  |');
        }
        i += 1;
        continue;
      }
      if (ch === "=" && next !== "=" && prev !== "=") {
        if (needNewline()) {
          output += "\n  =";
        } else {
          output = output.replace(/\n\s*$/, '\n  =');
        }
        i += 1;
        continue;
      }
    }
    output += ch;
    i++;
  }

  return output.trim();
}
