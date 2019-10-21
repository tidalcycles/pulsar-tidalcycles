# TidalCycles plugin for Atom
[![Build Status](https://travis-ci.org/tidalcycles/atom-tidalcycles.svg?branch=master)](https://travis-ci.org/tidalcycles/atom-tidalcycles)

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

By default, Atom will try to locate a `BootTidal.hs` file in the current directory.

If you'd like to provide a path to your own custom boot file on your computer, use
the *Boot Tidal Path* setting to do so.

If there's no `BootTidal.hs` file in the current directory and no custom boot file provided, Atom will use a [default Tidal bootup sequence](lib/BootTidal.hs)

## Sample Default Boot File

If you create your own boot file, you may start with the default:\
[BootTidal.hs](lib/BootTidal.hs)

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
