


'use strict'


############################################################################################################
GUY                       = require 'guy'
{ alert
  debug
  help
  info
  plain
  praise
  urge
  warn
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN-PARSER/HELPERS'
#...........................................................................................................
{ rpr
  inspect
  echo
  log     }               = GUY.trm
#...........................................................................................................
{ DATOM }                 = require 'datom'
#...........................................................................................................
{ new_datom
  lets
  stamp }                = DATOM

#-----------------------------------------------------------------------------------------------------------
@XXX_new_token = ( ref, token, mode, tid, name, value, start, stop, atrs = null, lexeme = null ) ->
  ### TAINT recreation of `Interlex::XXX_new_token()` ###
  jump      = lexeme?.jump ? null
  { start
    stop  } = token
  return new_datom "^#{mode}", { mode, tid, mk: "#{mode}:#{tid}", jump, name, value, \
    lnr1: null, x1: null, lnr2: null, x2: null, atrs, $: ref, }
