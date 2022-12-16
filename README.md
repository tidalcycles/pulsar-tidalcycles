# TidalCycles plugin for Atom

![CI](https://github.com/tidalcycles/atom-tidalcycles/actions/workflows/ci.yml/badge.svg?branch=master)

[TidalCycles](https://tidalcycles.org) is a live-coding pattern language

After TidalCycles installation (checkout [official documentation](https://tidalcycles.org/docs/) for details),

Then, you can:
  * Open a `.tidal` file
  * `shift+enter` to evaluate the current line or selection
  * `(cmd/ctrl)+enter` to evaluate multiple-lines or selection
  * `ctrl+alt+shift+enter` to evaluate the whole editor
  * `ctrl+<number>` to mute/unmute the connection <number>
  * `ctrl+alt+<number>` to mute/unmute the connection 1<number>
  * `ctrl+0` to unmute all

To send patterns to [SuperDirt](https://github.com/musikinformatik/SuperDirt), use `d1` .. `d9`, e.g.:
```
d1 $ sound "bd cp"
```

## Configuration

### Interpreter
You can choose between 3 Haskell interpreters:
* Default: ghci installed with Cabal is the default choice
* Stack: ghci installed with stack
* Nix: ghci installed with nix

### Haskell Path

By default the plugin will use the `ghci` and `ghc-pkg` binaries in $PATH configuration.

You can configure your Haskell binary folder to use a different version of it.
(Only works with *Default* interpreter)

### Boot Tidal Path

The plugin will load the `BootTidal.hs` file according to this sequence:
  * if configured, the file set in the  *Boot Tidal Path* configuration
  * if exists, the one in the current directory
  * if exists, the one in the current Tidal installation, given by the `ghc-pkg` binary configured with *Haskell Path*
  * the fallback choice is the one [included with the plugin](lib/BootTidal.hs)

### SuperDirt
SuperDirt can be started automatically at the first tidal code evaluation.
The plugin will use a `superdirt_startup.scp` if it's present into the current folder, otherwise it will use the [default startup command](./lib/superdirt_startup.scd).
This feature can be disabled in configuration.

### Autocomplete
You can turn on/off autocomplete with flag.

#### Documentation details with Hoogle
With [hoogle](https://github.com/ndmitchell/hoogle/blob/master/docs/Install.md) the autocomplete experience will improve and official tidal documentation will be shown.

Install hoogle and set the *Hoogle Path* configuration (by default it's already `hoogle`) if you install it with `stack`, add two dashes at the end of the property (e.g. `stack hoogle --`).

After installation you have to generate tidal documentation, in your terminal run:\
`hoogle generate tidal`\
or\
`stack hoogle -- generate tidal` (with stack)

### Console Prompt
Customize the console prompt with a string.
Placeholders can be used, e.g.
```
eval #%ec
```
will prompt:
```
eval #1>
eval #2>
etc...
```
#### Placeholders
* *%ec*: eval count
* *%ts*: current timestamp (unix format, seconds)
* *%diff*: character comparison difference between last two evaluations

### Osc Eval
It's possibile to evaluate tidal code from OSC messages.

#### Port
The atom plugin is listening on this specified port for incoming osc messages.
* Default Port: 3333

#### Ip
The atom plugin ist listenting on this ip address for incoming osc messages.

* Default Ip: 127.0.0.1

#### Address
The atom plugin is filtering incoming osc messages with this specified address.
* Default address: /atom/eval

#### Arguments

##### Type
Mandatory `type` argument to specify what kind of evaluation is requested:
1. line (evaluate single line)
2. multi_line (evaluate code block)
3. whole_editor (evaluate all the editor)

##### Row / Column
`row` and `column` parameters can be specified to move the cursor on that position before the evaluation.

### Sound Browser
To make the sound browser at the first tidal evaluation, add your paths to the `Sound Browser Folders` in the plugin configuration, separed by commas.\
Restart atom to apply changes.

### Other configurations
  * **Show error notifications**: show atom notifications on error  
  * **Only Log Last Message**: shows only last log message on console
  * **Only Show Log When Errors**: show only errors from ghci


## Troubleshooting

### Some flags have not been recognized: prompt-cont
The GHC version is too old (like 8.0.3).
Solutions:
* Comment, remove or bring to the end of the file the row `:set prompt-cont ""` in the `BootTidal.hs` file
* Upgrade GHC (to at least 8.6)

### '<path>' is not recognized as an internal or external command, operable program or batch file.
The BootTidal.hs and ghci path cannot contains whitespace inside.
Solutions:
* put you scripts and the BootTidal.hs in a path that doesn't contain whitespaces.

Note: there's a fix coming in GHC version 8.12

### Could not find module `Sound.Tidal.Context`
The `BootTidal.hs` file is loaded correctly, but tidal is not installed. Install it before following the official guide: \
https://tidalcycles.org/Installation

## Contributing

If you'd like to contribute to this package, here are some guidelines:

### JavaScript Formatting

A `.jsbeautifyfc` file is used to define JavaScript formatting settings. Please use
a beautifier package (we recommend `atom-beautify`) to format your changes with
these settings.

### Specs

Always run specs before PR.  
On Atom, execute the `Window: Run Package Specs` command (`ctrl+shift+y`).  
`0 failures` should be the result
