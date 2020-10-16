## 3.12.0
* Show atom error notifications by default. Should help troubleshooting. Could be disabled in configuration.

## 3.11.0
* Add `ctrl-alt-shift-enter` shortcut to evaluate all the code in the editor

## 3.10.1
* Fix `#` syntax highlight #109

## 3.10.0
* Add `ctrl-.` shortcut for hush command #102
* Add Console prompt customization, including some placeholders (described in [README](README.md))
* Removed obsolete `filterPromptFromLogMessages` configuration, with console prompt customization, the prompt log message is always filtered.

## 3.9.0
* Add interpreter configuration, to launch TidalCycles with *stack* or *nix*
* In BootTidal.hs moved prompt-cont line to the end of the file to avoid problems with old version of GHC

## 0.12.0 - current directory boot file option

* if selected, searches for a `BootTidal.hs` file in the current directory to use for booting Tidal.

## 0.11.0 - configurable boot file path

* specify location of a custom Tidal boot file in settings


## 0.1.0 - First Release
* Every feature added
* Every bug fixed
