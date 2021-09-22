# Changelog

## v3.16.15
* Fix autocomplete issue with tidal-listener #171

## v3.16.14
* Handle multi pattern highlight visualization on tidal listener
* Add detailed logs on ghc and BootTidal file loading

## v3.16.13
* Improve tidal-listener highlight visualization

## v3.16.12
* Introduced first version of code highlight with tidal-listener

## v3.16.11
* Set superdirt autostart to false by default

## v3.16.10
* Launch SuperDirt automatically inside Atom

## v3.16.9
* Add code block indicators on editor in preparation to listener interface.

## v3.16.8
* Fix syntax highlighting for `d10`, `d11`, `d12`... #154
* Introduce new `tidal-listener` interpreter. #157

## v3.16.7
* Fix osc eval

## v3.16.6
* Change unmuteAll keybind to `ctrl-0`
* Add toggle mute commands for connections from 10 to 11 with keybing `ctrl-shift-<second digit>`
* Console log tidal version on startup

## v3.16.5
* Avoid throwing an error that's not an error

## v3.16.3
* Fix a `tidalcycles:boot` bug
* Improve some errors visualization

## v3.16.2
* Fallback `BootTidal.hs` loading for paths containing whitespaces

## v3.16.1
* Improves `mutes` visualization on console

## v3.16.0
* Disable OSC eval server by default, could by enabled with configuration.
* Toggle mute shortcuts with `CTRL-<number>` and toggle mute all with `CTRL-SHIFT-.`

## v3.15.0
* **BREAKING CHANGE**: in OSC eval now messages args have key-value structure (like SuperDirt), that interface is well explained in [README](README.md)
* Show sample original file name in sound browser.
* Fix: escape `#` in samples file name in sound browser

## v3.14.1
* Improve sound browser UI

## v3.14.0
* Introduce sound browser.

## v3.13.0
* OSC eval: eval your code through OSC messages.

## v3.12.0
* Show atom error notifications by default. Should help troubleshooting. Could be disabled in configuration.

## v3.11.0
* Add `ctrl-alt-shift-enter` shortcut to evaluate all the code in the editor

## v3.10.1
* Fix `#` syntax highlight #109

## v3.10.0
* Add `ctrl-.` shortcut for hush command #102
* Add Console prompt customization, including some placeholders (described in [README](README.md))
* Removed obsolete `filterPromptFromLogMessages` configuration, with console prompt customization, the prompt log message is always filtered.

## v3.9.0
* Add interpreter configuration, to launch TidalCycles with *stack* or *nix*
* In BootTidal.hs moved prompt-cont line to the end of the file to avoid problems with old version of GHC

## 0.12.0 - current directory boot file option

* if selected, searches for a `BootTidal.hs` file in the current directory to use for booting Tidal.

## 0.11.0 - configurable boot file path

* specify location of a custom Tidal boot file in settings


## 0.1.0 - First Release
* Every feature added
* Every bug fixed
