

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
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN-PARSER/XXX-TEMP-HTML'
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
#...........................................................................................................
{ Pipeline
  Pipeline_module
  $
  transforms }            = require 'moonriver'
#...........................................................................................................
{ misfit
  get_base_types }        = require './types'
E                         = require './errors'
H                         = require './helpers'
{ Hypedown_parser_stars } = require './_hypedown-parser-stars'
{ Hypedown_parser_htmlish } \
                          = require './_hypedown-parser-htmlish'
{ Hypedown_lexer }        = require './_hypedown-lexer'


#===========================================================================================================
class @$001_Prelude extends Pipeline_module




