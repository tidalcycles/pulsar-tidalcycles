:set -XOverloadedStrings
:set prompt ""


import Sound.Tidal.Context
import System.IO (hSetEncoding, stdout, utf8)
hSetEncoding stdout utf8


:{
let p = streamReplace tidal
    hush = streamHush tidal
:}
