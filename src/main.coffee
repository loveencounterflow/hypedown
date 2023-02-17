

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
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN'
#...........................................................................................................
{ rpr
  inspect
  echo
  log     }               = GUY.trm
#...........................................................................................................
{ Interlex
  Syntax
  compose  }              = require 'intertext-lexer'
{ Markdown_sx
  Standard_sx
  Hypedown_lexer }        = require './_hypedown-lexer'
{ Hypedown_parser
  XXX_new_token }         = require './_hypedown-parser'




#===========================================================================================================
module.exports = {
  XXX_new_token
  Interlex
  Syntax
  Standard_sx
  Markdown_sx
  Hypedown_lexer
  Hypedown_parser }
