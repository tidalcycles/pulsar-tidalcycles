# TidalCycles plugin for Atom

[TidalCycles](https://tidalcycles.org) is a live-coding pattern language

For installation instructions, please visit:
  https://tidalcycles.org/index.php/Installation

Then, you can:
  * Open a `.tidal` file

  * `shift+enter` to evaluate the current line or selection

  * `cmd+enter` to evaluate multiple-lines or selection

To send patterns to [SuperDirt](https://github.com/musikinformatik/SuperDirt), use `d1` .. `d9`, e.g.:

````
d1 $ sound "bd cp"
````

# Configurable Boot Options

By default, Atom will use a default Tidal bootup sequence that doesn't really do
anything special other than create the `d1..d9` and `c1..c9` Dirt connections.

If you'd like to provide a path to your own custom boot file on your computer, use
the *Boot Tidal Path* setting to do so.

Further, if you'd like Atom to locate a `BootTidal.hs` file in the current directory,
check the *Use Boot File In Current Directory* option.

Boot file order of precedence:

1. Current directory `BootTidal.hs`
2. Custom Boot Tidal Path
3. Default bootup provided by the package

## Sample Default Boot File

If you create your own boot file, you may start with the default:

```
:set -XOverloadedStrings
:set prompt ""
:set prompt-cont ""

import Sound.Tidal.Context

-- total latency = oLatency + cFrameTimespan
tidal <- startTidal (superdirtTarget {oLatency = 0.1, oAddress = "127.0.0.1", oPort = 57120}) (defaultConfig {cFrameTimespan = 1/20})

let p = streamReplace tidal
let hush = streamHush tidal
let list = streamList tidal
let mute = streamMute tidal
let unmute = streamUnmute tidal
let solo = streamSolo tidal
let unsolo = streamUnsolo tidal
let once = streamOnce tidal False
let asap = streamOnce tidal True
let nudgeAll = streamNudgeAll tidal
let setcps = asap . cps
let xfade = transition tidal (Sound.Tidal.Transition.xfadeIn 4)
let xfadeIn t = transition tidal (Sound.Tidal.Transition.xfadeIn t)
let histpan t = transition tidal (Sound.Tidal.Transition.histpan t)
let wait t = transition tidal (Sound.Tidal.Transition.wait t)
let waitT f t = transition tidal (Sound.Tidal.Transition.waitT f t)
let jump = transition tidal (Sound.Tidal.Transition.jump)
let jumpIn t = transition tidal (Sound.Tidal.Transition.jumpIn t)
let jumpIn' t = transition tidal (Sound.Tidal.Transition.jumpIn' t)
let jumpMod t = transition tidal (Sound.Tidal.Transition.jumpMod t)
let mortal lifespan release = transition tidal (Sound.Tidal.Transition.mortal lifespan release)
let interpolate = transition tidal (Sound.Tidal.Transition.interpolate)
let interpolateIn t = transition tidal (Sound.Tidal.Transition.interpolateIn t)
let clutch = transition tidal (Sound.Tidal.Transition.clutch)
let clutchIn t = transition tidal (Sound.Tidal.Transition.clutchIn t)
let anticipate = transition tidal (Sound.Tidal.Transition.anticipate)
let anticipateIn t = transition tidal (Sound.Tidal.Transition.anticipateIn t)
let d1 = p "1"
let d2 = p "2"
let d3 = p "3"
let d4 = p "4"
let d5 = p "5"
let d6 = p "6"
let d7 = p "7"
let d8 = p "8"
let d9 = p "9"
let d10 = p "10"
let d11 = p "11"
let d12 = p "12"
let d13 = p "13"
let d14 = p "14"
let d15 = p "15"
let d16 = p "16"

:set prompt "tidal> "
```

# Contributing

If you'd like to contribute to this package, here are some guidelines:

## JavaScript Formatting

A `.jsbeautifyfc` file is used to define JavaScript formatting settings. Please use
a beautifier package (we recommend `atom-beautify`) to format your changes with
these settings.

## Specs

Always run specs before PR.  
On Atom, execute the `Window: Run Package Specs` command.  
`0 failures` should be the result
