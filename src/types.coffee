
'use strict'


############################################################################################################
GUY                       = require 'guy'
# { alert
#   debug
#   help
#   info
#   plain
#   praise
#   urge
#   warn
#   whisper }               = GUY.trm.get_loggers 'HYPEDOWN/TYPES'
{ debug }                 = GUY.trm.get_loggers 'HYPEDOWN/TYPES'
{ rpr
  inspect
  echo
  log     }               = GUY.trm
{ Intertype }             = require 'intertype'
base_types                = null
misfit                    = Symbol 'misfit'


#-----------------------------------------------------------------------------------------------------------
get_base_types = ->
  return base_types if base_types?
  #.........................................................................................................
  base_types                = new Intertype()
  { declare }               = base_types
  #.........................................................................................................
  declare.hd_constructor_cfg
    fields:
      foo:      'boolean'
    default:
      foo:      true
  #.........................................................................................................
  return base_types


#===========================================================================================================
module.exports = { misfit, get_base_types, }



