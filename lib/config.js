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
  'superDirt.autostart': {
    description: 'Start SuperDirt at startup',
    type: 'boolean',
    default: true,
    order: 25
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
  'consolePrompt': {
    type: 'string',
    default: 't',
    description: `Console prompt. Look at the docs for available placeholders`,
    order: 50
  },
  'showErrorNotifications': {
    type: 'boolean',
    default: true,
    description: 'Show atom notifications on error.',
    order: 55
  },
  'onlyShowLogWhenErrors': {
    type: 'boolean',
    default: false,
    description: 'Only show console if last message was an error.',
    order: 60
  },
  'onlyLogLastMessage': {
    type: 'boolean',
    default: false,
    description: 'Only log last message to the console.',
    order: 70
  },
  'oscEvalEnable': {
    type: 'boolean',
    default: false,
    description: `Check to enable OSC eval code server.`,
    order: 75
  },
  'oscEvalPort': {
    type: 'integer',
    default: 3333,
    description: `OSC port for receiving eval messages.`,
    order: 80
  },
  'oscEvalIp': {
    type: 'string',
    default: '127.0.0.1',
    description: `OSC ip address for receiving eval messages.`,
    order: 81
  },
  'oscEvalAddress': {
    type: 'string',
    default: '/atom/eval',
    description: `OSC address for receiving eval messages. Expected arguments are 'line', 'multi_line' and 'whole_editor'.`,
    order: 82
  },
  'soundBrowserFolders': {
    type: 'array',
    default: [],
    description: 'Folders which must be shown in the sound browser, separed by comma. Restart atom to apply changes',
    order: 90,
    items: {
      type: 'string'
    }
  }
}
