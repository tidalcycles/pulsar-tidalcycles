'use babel'

export const LINE = 'line'
export const MULTI_LINE = 'multi_line'
export const WHOLE_EDITOR = 'whole_editor'

export function isTidal() {
  var editor = getEditor()
  if (!editor) {
    return false
  } else {
    return editor.getGrammar().scopeName === 'source.tidalcycles'
  }
}

export function currentEvaluations(evalType) {
  var editor = getEditor();
  if (!editor) return;

  var selection = editor.getLastSelection();
  var expression = selection.getText();

  if (expression) {
    var range = selection.getBufferRange();
    return [{ expression, range }];
  } else {
    switch (evalType) {
      case LINE:
        return getLineExpression(editor);
      case MULTI_LINE:
        return getMultiLineExpression(editor);
      case WHOLE_EDITOR:
        return getWholeEditorExpressions(editor);
    }
  }
}

export function evalFlash(range) {
  var editor = getEditor();
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


export function copyRange(range) {
  var editor = getEditor();
  var endRow = range.end.row;
  endRow++
  var text = editor.getTextInBufferRange(range);
  text = '\n' + text + '\n';

  if (endRow > editor.getLastBufferRow()) {
    text = '\n' + text
  }

  editor.getBuffer().insert([endRow, 0], text);
}

let getLineExpression = (editor) => {
  var cursor = editor.getCursors()[0];
  var range = cursor.getCurrentLineBufferRange();
  var expression = range && editor.getTextInBufferRange(range);
  return [{ expression, range }];
}

let getMultiLineExpression = (editor) => {
  var range = getCurrentParagraphIncludingComments(editor);
  var expression = editor.getTextInBufferRange(range);
  return [{ expression, range }];
}

let getWholeEditorExpressions = (editor) => {
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

let getCurrentParagraphIncludingComments = (editor) => {
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

let getEditor = () => atom.workspace.getActiveTextEditor()
