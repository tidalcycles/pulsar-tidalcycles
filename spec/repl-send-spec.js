'use babel'

const Repl = require('../lib/repl.js');

describe('repl send re-arm', () => {
  let ghci;
  let highlighter;
  let repl;

  beforeEach(() => {
    ghci = { writeLine: jasmine.createSpy('writeLine') };
    highlighter = {
      onHush: jasmine.createSpy('onHush'),
      addMetadata: (command) => command,
      afterSend: jasmine.createSpy('afterSend'),
    };
    repl = new Repl(
      { logPromptOut: () => { }, logPromptErr: () => { } },
      { interactive: () => ghci },
      { choosePath: () => '', blocks: () => [] },
      {},
      {},
      highlighter
    );
    repl.ghci = ghci;
  });

  it('should re-arm only after the closing brace of an expression block', () => {
    repl.tidalSendLine(':{', undefined);
    expect(highlighter.afterSend).not.toHaveBeenCalled();

    repl.tidalSendLine('d1 $ s "bd"', 0);
    expect(highlighter.afterSend).not.toHaveBeenCalled();

    repl.tidalSendLine(':}', undefined);
    expect(highlighter.afterSend.calls.count()).toEqual(1);
  });

  it('should re-arm after a single non-block command', () => {
    repl.tidalSendLine('mute 3', undefined);

    expect(ghci.writeLine).toHaveBeenCalledWith('mute 3');
    expect(highlighter.afterSend.calls.count()).toEqual(1);
  });

  it('should not re-arm when the event highlighter is disabled', () => {
    const plainRepl = new Repl(
      { logPromptOut: () => { }, logPromptErr: () => { } },
      { interactive: () => ghci },
      { choosePath: () => '', blocks: () => [] }
    );
    plainRepl.ghci = ghci;

    plainRepl.tidalSendExpression('d1 $ s "bd"', { start: { row: 0 } });

    expect(highlighter.afterSend).not.toHaveBeenCalled();
  });

  it('should wipe highlight state on hush and re-arm once', () => {
    repl.tidalSendExpression('hush', { start: { row: 0 } });

    expect(highlighter.onHush).toHaveBeenCalledTimes(1);
    expect(highlighter.afterSend.calls.count()).toEqual(1);
  });
});
