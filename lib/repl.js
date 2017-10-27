'use babel';

var fs = require('fs');
var spawn = require('child_process').spawn;
var Range = require('atom').range;
var bootFilePath = __dirname + "/BootTidal.hs"
var CONST_LINE = 'line'
var CONST_MULTI_LINE = 'multi_line'

export default class REPL {

    repl: null
    consoleView: null

    constructor(consoleView) {
        this.consoleView = consoleView;

        atom.commands.add('atom-workspace', {
            "tidalcycles:boot": () => {
                if (this.editorIsTidal()) {
                    this.start();
                    return;
                }
                console.error('Not a .tidal file.');
            }
        });

        atom.commands.add('atom-text-editor', {
            'tidalcycles:eval': () => this.eval(CONST_LINE, false),
            'tidalcycles:eval-multi-line': () => this.eval(CONST_MULTI_LINE, false),
            'tidalcycles:eval-copy': () => this.eval(CONST_LINE, true),
            'tidalcycles:eval-multi-line-copy': () => this.eval(CONST_MULTI_LINE, true),
            'tidalcycles:hush': () => this.hush(),
            'tidalcycles:copy-console': () => atom.clipboard.write(tidalRepl.consoleView.tidalConsole.innerText)
        });

    }

    editorIsTidal() {
        var editor = this.getEditor();
        if (!editor) return false;
        return editor.getGrammar().scopeName === 'source.tidalcycles';
    }

    hush() {
        this.tidalSendExpression("hush");
    }

    doSpawn() {
        this.repl = spawn(this.getGhciPath(), [], { shell: true });
        this.repl.stderr.on('data', (data) => {
          console.error(data.toString('utf8'));
          this.consoleView.logStderr();
          this.consoleView.logStderr(data.toString('utf8'));
          this.consoleView.logStderr();
        });
        this.repl.stdout.on('data', (data) => this.consoleView.logStdout(data.toString('utf8')));
    }

    getGhciPath() {
        var path = atom.config.get('tidalcycles.ghciPath');
        return path;
    }

    initTidal() {
        var commands = fs.readFileSync(bootFilePath).toString().split('\n');
        for (var i = 0; i < commands.length; i++) {
            this.tidalSendLine(commands[i]);
        }
    }

    stdinWrite(command) {
        this.repl.stdin.write(command);
    }

    tidalSendLine(command) {
        this.stdinWrite(command);
        this.stdinWrite('\n');
    }

    tidalSendExpression(expression) {
        this.tidalSendLine(':{');
        var splits = expression.split('\n');
        for (var i = 0; i < splits.length; i++) {
            this.tidalSendLine(splits[i]);
        }
        this.tidalSendLine(':}');
    }

    start() {
        this.consoleView.initUI();
        this.doSpawn();
        this.initTidal();
    }
    getEditor() {
        var editor = atom.workspace.getActiveTextEditor();
        return editor;
    }

    eval(evalType, copy) {
        if (!this.editorIsTidal()) return;

        if (!this.repl) this.start();

        var expressionAndRange = this.currentExpression(evalType);
        var expression = expressionAndRange[0];
        var range = expressionAndRange[1];
        this.evalWithRepl(expression, range, copy);
    }

    evalWithRepl(expression, range, copy) {
        var self = this;
        if (!expression) return;

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
        if (this.repl) {
            this.repl.kill();
        }
    }

    currentExpression(evalType) {
        var editor = this.getEditor();
        if (!editor) return;

        var selection = editor.getLastSelection();
        var expression = selection.getText();

        if (expression) {
            var range = selection.getBufferRange();
            return [expression, range];
        } else {
            if (evalType === CONST_LINE) {
                return this.getLineExpression(editor);
            }
            return this.getMultiLineExpression(editor);
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
        return [expression, range];
    }

    getMultiLineExpression(editor) {
        var range = this.getCurrentParagraphIncludingComments(editor);
        var expression = editor.getTextInBufferRange(range);
        return [expression, range];
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
            start: { row: startRow + 1, column: 0 },
            end: { row: endRow, column: 0 },
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
                class: "eval-flash"
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
