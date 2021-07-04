'use babel'

const EventEmitter = require('events');

export const LINE = 'line'
export const MULTI_LINE = 'multi_line'
export const WHOLE_EDITOR = 'whole_editor'

export class Editors extends EventEmitter {

  constructor() {
    super();
    this.decorations = [];
    this.decorateCodeBlocks();
    currentEditor().onDidChange(() => this.decorateCodeBlocks());
  }

  currentIsTidal() {
    let editor = currentEditor()
    if (!editor) {
      return false
    } else {
      return editor.getGrammar().scopeName === 'source.tidalcycles'
    }
  }

  currentEvaluations(evalType) {
    let editor = currentEditor();
    if (!editor) return;

    var selection = editor.getLastSelection();
    var expression = selection.getText();

    if (expression) {
      var range = selection.getBufferRange();
      return [{ expression, range }];
    } else {
      switch (evalType) {
        case LINE:
          return this.getLineExpression(editor);
        case MULTI_LINE:
          return this.getMultiLineExpression(editor);
        case WHOLE_EDITOR:
          return this.getWholeEditorExpressions(editor);
      }
    }
  }

  evalFlash(range) {
    var editor = currentEditor();
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

      setTimeout(() => marker.destroy(), 120);
    };
  }

  copyRange(range) {
    var editor = currentEditor();
    var endRow = range.end.row;
    endRow++
    var text = editor.getTextInBufferRange(range);
    text = '\n' + text + '\n';

    if (endRow > editor.getLastBufferRow()) {
      text = '\n' + text
    }

    editor.getBuffer().insert([endRow, 0], text);
  }

  goTo(row, column) {
    currentEditor().setCursorBufferPosition([row, column])
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
        if (item.trim().length === 0) {
          blocks.push({ rows: [] })
        } else {
          let block = blocks[blocks.length - 1]
          if (block.start === undefined) {
            block.start = index
          }
          block.rows.push(item)
          blocks[blocks.length - 1] = block
        }

        return blocks
      }, [{ rows: [] }])
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

  decorateCodeBlocks() {
    let editor = currentEditor()
    let newLineCount = editor.getLineCount();
    if (newLineCount !== this.lineCount) {
      this.decorations.forEach(decoration => decoration.destroy())

      this.decorations = this.getWholeEditorExpressions(editor)
        .map(it => it.range)
        .map(range => [[range.start.row, 0], [range.end.row, 0]])
        .map(range => editor.markBufferRange(range, { invalidate: 'never' }))
        .map(marker => editor.decorateMarker(marker, { type: 'line-number', class: 'cursor-line' }))

      this.lineCount = newLineCount
    }
  }

}

let currentEditor = () => atom.workspace.getActiveTextEditor()
