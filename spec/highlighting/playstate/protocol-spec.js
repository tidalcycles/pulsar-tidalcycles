'use babel'

const StdoutCollector = require("../../../lib/highlighting/playstate/protocol").StdoutCollector;

describe('StdoutCollector', () => {
    let received;
    let collector;

    beforeEach(() => {
        received = [];
        collector = new StdoutCollector(lines => received.push(lines));
    });

    it('should pass plain output through to the log', () => {
        const log = collector.consume('tidal> ok\n');

        expect(log).toEqual(['tidal> ok']);
        expect(received).toEqual([]);
    });

    it('should route locked blocks to the handler and hide them from the log', () => {
        const log = collector.consume(
            'INIT_PLAYSTATE_START\nd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano\nINIT_PLAYSTATE_END\n'
        );

        expect(log).toEqual([]);
        expect(received.length).toEqual(1);
        expect(received[0]).toEqual([
            'INIT_PLAYSTATE_START',
            'd1,[((8,2),(18,2))],0,1,1,1,0,1,superpiano',
            'INIT_PLAYSTATE_END',
        ]);
    });

    it('should reassemble blocks split across chunks', () => {
        collector.consume('tidal> ok\nINIT_PLAYSTATE_ST');
        collector.consume('ART\nrow1\nrow2\nINIT_PLAYSTATE_END\nmore\n');

        expect(received.length).toEqual(1);
        expect(received[0]).toEqual(['INIT_PLAYSTATE_START', 'row1', 'row2', 'INIT_PLAYSTATE_END']);
    });

    it('should hold incomplete trailing lines until the newline arrives', () => {
        expect(collector.consume('half line')).toEqual([]);

        const log = collector.consume('\nnext\n');
        expect(log).toEqual(['half line', 'next']);
    });

    it('should keep logging after a block completes', () => {
        collector.consume('INIT_PLAYSTATE_START\nrow\nINIT_PLAYSTATE_END\n');
        const log = collector.consume('plain\n');

        expect(log).toEqual(['plain']);
    });
});
