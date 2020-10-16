'use babel'

import * as path from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

const oscPortProperty = 'tidalcycles.oscEvalPort';
const oscAddressProperty = 'tidalcycles.oscEvalAddress';

export default class OscLoader extends EventEmitter {

    constructor(tidalRepl) {
        super();
        console.log("listening on port", atom.config.get(oscPortProperty));
        this.port = atom.config.get(oscPortProperty);
        this.server = spawn(
            'node',
            [path.resolve(__dirname, 'osc-server.js'), this.port.toString()],
            {
                cwd: path.resolve(__dirname, '..'),
            },
        );
        this.server.stdout.on('data', this.stdout);
        this.server.stderr.on('data', this.stderr);
        this.server.on('exit', this.exit);

        this.on(atom.config.get(oscAddressProperty), (args) => {tidalRepl.eval(args[0], false);});
    }


    setPort(port) {
      try {
          this.server.kill()

      } catch (e) {
          console.error(e)
      }

      this.port = port
      console.log("setting port to " + port)
      this.server = spawn(
          'node',
          [path.resolve(__dirname, 'osc-server.js'), this.port.toString()],
          {
              cwd: path.resolve(__dirname, '..'),
          },
      )
      this.server.stdout.on('data', this.stdout)
      this.server.stderr.on('data', this.stderr)
      this.server.on('exit', this.exit)
    }

    destroy() {
        try {
            this.server.kill()
        } catch (e) {
            console.error(e)
        }
    }

    // for live coding, when new event listener is added, remove
    // previous listeners at the same address
    on(addr, callback){
      this.removeAllListeners(addr)
      super.on(addr, callback)
    }

    stdout = (output) => {

        const s = output.toString().trim()

        s.split('\n').forEach(line => {
            let msg;
            try {
                msg = JSON.parse(line);
            } catch (e) { console.log("error", e)}

            if (msg) {
                this.emit('*', msg)
                this.emit(msg.address, msg.args)
            }
        });
    };


    stderr = (output) => {
        console.error(output.toString())
    };

    exit = (code) => {
        console.log('[TidalCycles] OSC server exited with code', code)
    };
}
