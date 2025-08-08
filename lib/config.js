'use babel';

export default {
  'interpreter': {
    type: 'string',
    default: 'default',
    enum: [
      { value: 'default', description: 'Default (ghc installed through cabal)' },
      { value: 'stack', description: 'Stack' },
      { value: 'nix', description: 'Nix' },
      { value: 'listener', description: 'tidal-listener' }
    ],
    order: 0
  },
  'ghciPath': {
    type: 'string',
    default: '',
    description: 'Haskell (ghci) path, needed only for the "Default" interpreter',
    order: 10
  },
  'bootTidalPath': {
    type: 'string',
    default: '',
    order: 20
  },
  'superDirt': {
    type: 'object',
    properties: {
      'autostart': {
        description: 'Start SuperDirt at startup',
        type: 'boolean',
        default: false,
        order: 25
      },
    }
  },
  'autocomplete': {
    type: 'boolean',
    default: true,
    description: 'Autocomplete code',
    order: 30
  },
  'hooglePath': {
    type: 'string',
    default: 'hoogle',
    description: 'Path of hoogle command, needed for documentation on autocomplete',
    order: 40
  },
  'console': {
    type: 'object',
    properties: {
      'prompt': {
        type: 'string',
        default: 't',
        description: `Prompt. Look at the docs for available placeholders`,
        order: 50
      },
      'onlyShowLogWhenErrors': {
        type: 'boolean',
        default: false,
        description: 'Only show console if last message was an error.',
        order: 55
      },
      'onlyLogLastMessage': {
        type: 'boolean',
        default: false,
        description: 'Only log last message to the console.',
        order: 60
      },
    }
  },
  'showErrorNotifications': {
    type: 'boolean',
    default: true,
    description: 'Show editor notifications on error.',
    order: 70
  },
  'oscEval': {
    type: 'object',
    title: 'OSC eval',
    description: 'Eval code through OSC messages',
    properties: {
      'enable': {
        type: 'boolean',
        default: false,
        title: 'enable',
        description: `Check to enable OSC eval code server.`,
        order: 75
      },
      'ip': {
        type: 'string',
        default: '127.0.0.1',
        title: 'ip',
        description: `OSC ip address for receiving eval messages.`,
        order: 79
      },
      'port': {
        type: 'integer',
        default: 3333,
        title: 'port',
        description: `OSC port for receiving eval messages.`,
        order: 80
      },
      'address': {
        type: 'string',
        default: '/pulsar/eval',
        title: 'address',
        description: `OSC address for receiving eval messages. Expected arguments are 'line', 'multi_line' and 'whole_editor'.`,
        order: 82
      },
    }
  },
  'soundBrowser': {
    type: 'object',
    title: 'Sound Browser',
    description: 'Show samples folder and permits to listen to them in advance.',
    properties: {
      'folders': {
        type: 'array',
        default: [],
        description: 'Folders which must be shown in the sound browser, separed by comma. Restart the editor to apply changes',
        order: 90,
        items: {
          type: 'string'
        }
      }
    }
  },
  'eventHighlighting': {
    type: 'object',
    title: 'Event Highlighting',
    description: '',
    properties: {
      'enable': {
        type: 'boolean',
        default: false,
        title: 'enable',
        description: 'Check to enable event highlighting.',
        order: 95
      },
      'ip': {
        type: 'string',
        default: "127.0.0.1",
        description: 'OSC IP where you expect to receive TidalCycles highlight events.',
        order: 105,
      },
      'port': {
        type: 'number',
        default: 6013,
        description: 'OSC Port where you expect to receive TidalCycles highlight events.',
        order: 110,
      }
    }
  }
}
