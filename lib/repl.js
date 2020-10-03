'use babel';

const Status = require('./status')

// TODO: rename those constants with meaningful names
var CONST_LINE = 'line'
var CONST_MULTI_LINE = 'multi_line'
var CONST_WHOLE_EDITOR = 'whole_editor'
let status = new Status()

export default class REPL {

  ghci = null
  consoleView = null
  stdErr = null
  stdOut = null
  stdTimer = 0

  constructor(consoleView, ghc, bootTidal) {
    this.consoleView = consoleView;
    this.stdErr = []
    this.stdOut = []
    this.ghc = ghc
    this.bootTidal = bootTidal

    atom.commands.add('atom-workspace', {
      'tidalcycles:boot': () => {
        if (this.editorIsTidal()) {
          this.start();
        } else {
          console.error('Not a .tidal file.');
        }
      },
      'tidalcycles:reboot': () => {
        this.destroy();
        this.start();
      }
    });

    atom.commands.add('atom-text-editor', {
      'tidalcycles:eval': () => this.eval(CONST_LINE, false),
      'tidalcycles:eval-multi-line': () => this.eval(CONST_MULTI_LINE, false),
      'tidalcycles:eval-whole-editor': () => this.eval(CONST_WHOLE_EDITOR, false),
      'tidalcycles:eval-copy': () => this.eval(CONST_LINE, true),
      'tidalcycles:eval-multi-line-copy': () => this.eval(CONST_MULTI_LINE, true),
      'tidalcycles:hush': () => this.hush()
    });
  }

  editorIsTidal() {
    var editor = this.getEditor();
    if (!editor) return false;
    return editor.getGrammar().scopeName === 'source.tidalcycles';
  }

  start() {
    status.reset()

    this.ghci = this.ghc.interactive()
      .on('stderr', data => { this.processStdErr(data) })
      .on('stdout', data => { this.processStdOut(data) })

    this.initTidal();
  }

  hush() {
    this.tidalSendExpression('hush');
  }

  processStdOut(data) {
    this.stdOut.push(data.toString('utf8'))
    this.processStd()
  }

  processStdErr(data) {
    this.stdErr.push(data.toString('utf8'))
    this.processStd()
  }

  processStd() {
    clearTimeout(this.stdTimer)
    // defers the handler of stdOut/stdErr data
    // by some arbitrary ammount of time (50ms)
    // to get the buffer filled completly
    this.stdTimer = setTimeout(() => this.flushStd(), 50);
  }

  flushStd() {
    let consolePrompt = atom.config.get('tidalcycles.consolePrompt')
      .replace("%ec", status.evalCount())
      .replace("%ts", status.timestamp())
      .replace("%diff", status.diff())

    if (this.stdErr.length) {
      let output = this.stdErr.join('')
        .trim()
        .replace(/<interactive>.*error:/g, "")
        .replace(/ \(bound at.*/g, "")

      output = consolePrompt + ">" + output

      this.consoleView.logStderr(output);
      this.stdErr.length = 0
      //dont care about stdOut if there are errors
      this.stdOut.length = 0
    }

    if (this.stdOut.length) {
      let output = this.stdOut.join('')
        .trim()
        .replace(/tidal>.*Prelude>/g, "")
        .replace(/tidal>/g, "")
        .replace(/Prelude>/g, "")
        .replace(/Prelude.*\|/g, "")
        .replace(/GHCi.*help/g, "")

      output = consolePrompt + ">" + output

      this.consoleView.logStdout(output);
      this.stdOut.length = 0
    }

  }

  initTidal() {
    const bootPath = this.bootTidal.choosePath()
    this.consoleView.logStdout(`Load BootTidal.hs from ${bootPath}`)
    this.tidalSendLine(`:script ${bootPath}`)
  }

  tidalSendExpression(expression) {
    this.tidalSendLine(':{');

    expression.split('\n')
      .forEach(line => this.tidalSendLine(line));

    this.tidalSendLine(':}');
  }

  tidalSendLine(command) {
    this.ghci.writeLine(command);
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  eval(evalType, copy) {
    if (!this.editorIsTidal()) return;

    if (!this.ghci) this.start();

    let evaluations = this.currentEvaluations(evalType);
    for (var i = 0; i < evaluations.length; i++) {
      let evaluation = evaluations[i]
      var expression = evaluation.expression;
      var range = evaluation.range;
      status.eval({ characters: expression.length })
      this.evalWithRepl(expression, range, copy);
    }
  }

  evalWithRepl(expression, range, copy) {
    var self = this;
    if (!expression) return;

    // TODO: is needed that nested function work?
    function doIt() {
      var unflash;
      if (range) {
        unflash = self.evalFlash(range);
        var copyRange;
        if (copy) {
          copyRange = self.copyRange(range);
        }
      }

      function onSuccess() {
        if (unflash) {
          unflash('eval-success');
        }
      }

      self.tidalSendExpression(expression);
      onSuccess();
    }

    doIt();
  }

  destroy() {
    if (this.ghci) {
      this.ghci.destroy();
    }
  }

  currentEvaluations(evalType) {
    var editor = this.getEditor();
    if (!editor) return;

    var selection = editor.getLastSelection();
    var expression = selection.getText();

    if (expression) {
      var range = selection.getBufferRange();
      return [{ expression, range }];
    } else {
      switch (evalType) {
        case CONST_LINE:
          return this.getLineExpression(editor);
        case CONST_MULTI_LINE:
          return this.getMultiLineExpression(editor);
        case CONST_WHOLE_EDITOR:
          return this.getWholeEditorExpressions(editor);
      }
    }
  }

  copyRange(range) {
    var editor = this.getEditor();
    var endRow = range.end.row;
    endRow++
    var text = editor.getTextInBufferRange(range);
    text = '\n' + text + '\n';

    if (endRow > editor.getLastBufferRow()) {
      text = '\n' + text
    }

    editor.getBuffer().insert([endRow, 0], text);
  }

  getLineExpression(editor) {
    var cursor = editor.getCursors()[0];
    var range = cursor.getCurrentLineBufferRange();
    var expression = range && editor.getTextInBufferRange(range);
    return [{ expression, range }];
  }

  getMultiLineExpression(editor) {
    var range = this.getCurrentParagraphIncludingComments(editor);
    var expression = editor.getTextInBufferRange(range);
    return [{ expression, range }];
  }

  getWholeEditorExpressions(editor) {
    let wholeEditor = {
      start: { row: 0, column: 0 },
      end: { row: editor.getLineCount(), column: 0 }
    }
    let expression = editor.getTextInBufferRange(wholeEditor);

    return expression.split('\n')
      .reduce((blocks, item, index) => {
        if (blocks.length === 0) {
          blocks.push({ rows: [] })
        }

        if (item.trim().length === 0) {
          blocks.push({ rows: [] })
        } else {
          let block = blocks[blocks.length - 1]
          if (!block.start) {
            block.start = index
          }
          block.rows.push(item)
          blocks[blocks.length - 1] = block
        }

        return blocks
      }, [])
      .filter(block => block.rows.length > 0)
      .map(block => {
        return {
          expression: block.rows.join('\n'),
          range: {
            start: { row: block.start, column: 0},
            end: { row: block.start + block.rows.length, column: 0},
          }
        }
      })
  }

  getCurrentParagraphIncludingComments(editor) {
    var cursor = editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = editor.getLineCount();

    // lines must include non-whitespace characters
    // and not be outside editor bounds
    while (/\S/.test(editor.lineTextForBufferRow(startRow)) && startRow >= 0) {
      startRow--;
    }
    while (/\S/.test(editor.lineTextForBufferRow(endRow)) && endRow < lineCount) {
      endRow++;
    }
    return {
      start: {
        row: startRow + 1,
        column: 0
      },
      end: {
        row: endRow,
        column: 0
      },
    };
  }

  evalFlash(range) {
    var editor = this.getEditor();
    var marker = editor.markBufferRange(range, {
      invalidate: 'touch'
    });

    var decoration = editor.decorateMarker(
      marker, {
        type: 'line',
        class: 'eval-flash'
      });

    // return fn to flash error / success and destroy the flash
    return function(cssClass) {
      decoration.setProperties({
        type: 'line',
        class: cssClass
      });
      var destroy = function() {
        marker.destroy();
      };
      setTimeout(destroy, 120);
    };
  }
}
