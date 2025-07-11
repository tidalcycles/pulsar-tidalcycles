# TidalCycles plugin for Pulsar

![CI](https://github.com/tidalcycles/pulsar-tidalcycles/actions/workflows/ci.yml/badge.svg?branch=master)

[TidalCycles](https://tidalcycles.org) is a language for live coding algorithmic patterns.

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

### GHCI Path

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
You can turn on/off autocomplete with this option.

#### Documentation details with Hoogle
With [hoogle](https://github.com/ndmitchell/hoogle/blob/master/docs/Install.md) the autocomplete experience will improve and official tidal documentation will be shown.

Install hoogle and set the *Hoogle Path* configuration (by default it's already `hoogle`) if you install it with `stack`, add two dashes at the end of the property (e.g. `stack hoogle --`).

After installation you have to generate tidal documentation, in your terminal run:\
`hoogle generate tidal`\
or\
`stack hoogle -- generate tidal` (with stack)

### Console
The console can be customized:

#### Prompt
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
##### Placeholders
* *%ec*: eval count
* *%ts*: current timestamp (unix format, seconds)
* *%diff*: character comparison difference between last two evaluations

#### Only Show Log When Errors
Filter all the console log and show only errors

#### Only Log Last Message
Filter all the console old logs and show only the last one

### Event Highlighting

The event highlighting allows to visualize the active events within a mini notation pattern. This means, that only events within quotation marks will be considered.

#### TidalCycles configuration

TidalCycles needs to be configured to send editor highlight events. This is usually done by modifying the `BootTidal.hs` file and adding an editor highlight target. Here is a working example:

```haskell
let editorTarget = Target {oName = "editor", oAddress = "127.0.0.1", oPort = 6013, oLatency = 0.2, oSchedule = Pre BundleStamp, oWindow = Nothing, oHandshake = False, oBusPort = Nothing }
let editorShape = OSCContext "/editor/highlights"

tidal <- startStream (defaultConfig {cFrameTimespan = 1/30, , cProcessAhead = (1/20)}) [(superdirtTarget {oLatency = 0.02}, [superdirtShape]), (editorTarget, [editorShape])]
```

The path to the `BootTidal.hs` file can be found in the TidalCycles output console after TidalCycles has been booted in the editor.

#### Framerate

The event highlight animation is in relation to the refresh rate of the users display and the `cFrameTimespan` value of TidalCycles. This means, that the animation fps needs to be smaller then the denominator of the `cFrameTimespan` value. However a good value is somehow between `20 fps` and `30 fps`.

#### Custom Styles

It is possible to customize the event highlighting css styles. For this you can add the css classes under `Pulsar -> Stylesheet...`.

There is a default style, that can be overriden like this in the global stylesheet:

```css
.event-highlight {
  outline: 2px solid orange;
  outline-offset: 0px;
}
```

And it is possible to override the styles for every individual stream like this:

```css
.event-highlight-2 {
  background-color: white;
}
```

The pattern of the css class is `.event-highlight-[streamID]`.

### Osc Eval
It's possibile to evaluate tidal code with OSC messages.

#### Port
The plugin is listening on this specified port for incoming osc messages:
* Default Port: 3333

#### Ip
The plugin is listening on this ip address for incoming osc messages:

* Default Ip: 127.0.0.1

#### Address
The plugin is filtering incoming osc messages with this specified address.
* Default address: /pulsar/eval

#### Arguments

##### Type
Mandatory `type` argument to specify what kind of evaluation is requested:
1. line (evaluate single line)
2. multi_line (evaluate code block)
3. whole_editor (evaluate all the editor)

##### Row / Column
`row` and `column` parameters can be specified to move the cursor on that position before the evaluation.

### Sound Browser
To make the sound browser at the first tidal evaluation, add your paths to the `Sound Browser Folders` in the plugin configuration, separed by commas.\ For example, on macOS, the default SuperDirt samples are at \
`/Users/<yourUser>/Library/Application Support/SuperCollider/downloaded-quarks/Dirt-Samples/` \
Restart editor (Pulsar) to apply changes.

### Other configurations
  * **Show error notifications**: show editor notifications on error  

## Troubleshooting

### Some flags have not been recognized: prompt-cont
The GHC version is too old (like 8.0.3).
Solutions:
* Comment, remove or bring to the end of the file the row `:set prompt-cont ""` in the `BootTidal.hs` file
* Upgrade GHC (to at least 8.6)

### '<path>' is not recognized as an internal or external command, operable program or batch file.
The BootTidal.hs and ghci path cannot contain whitespace inside.
Solutions:
* put your scripts and the BootTidal.hs in a path that doesn't contain whitespaces.

Note: this is fixed in GHC version 8.12

### Could not find module `Sound.Tidal.Context`
The `BootTidal.hs` file is loaded correctly, but tidal is not installed or did not load correctly. Try restarting your editor. To install tidal, follow the documentation for your platform: \
[Documentation > Install Tidal](https://tidalcycles.org/docs/)

### Variable not in scope
This could mean that the BootTidal.hs file you are using has a value not supported by the version of tidal you have installed. You can find the variable in the error message in your BootTidal.hs and comment out that line (using double hyphens).

## Contributing

If you'd like to contribute to this package, here are some guidelines:

### JavaScript Formatting

A `.jsbeautifyfc` file is used to define JavaScript formatting settings. Please use
a beautifier package (we recommend `atom-beautify`) to format your changes with
these settings.

### Specs
Always run specs before open a PR.
To run them:
```shell
pulsar --test spec
```
