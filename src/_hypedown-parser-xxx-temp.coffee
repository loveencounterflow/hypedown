

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


#===========================================================================================================
class @$010_prepare_paragraphs extends Pipeline_module

  #---------------------------------------------------------------------------------------------------------
  $inject_virtual_nl: ->
    ### normalize start of document by injecting two newlines. ###
    is_first  = true
    mode      = 'plain'
    tid       = 'nl'
    mk        = "#{mode}:#{tid}"
    return ( d, send ) ->
      return send d unless is_first
      is_first = false
      send { mode, tid, mk, jump: null, value: '', lnr1: 1, x1: 0, lnr2: 1, x2: 0, \
        data: { virtual: true, }, $key: '^plain', $: 'inject_virtual_nl', }
      send { mode, tid, mk, jump: null, value: '', lnr1: 1, x1: 0, lnr2: 1, x2: 0, \
        data: { virtual: true, }, $key: '^plain', $: 'inject_virtual_nl', }
      send d

  #---------------------------------------------------------------------------------------------------------
  $add_parbreak_markers: -> ### needs inject_virtual_nl ###
    mode        = 'plain'
    newline_lx  = "#{mode}:nl"
    tid         = 'parbreak'
    mk          = "html:#{tid}"
    p           = new Pipeline()
    template    = { \
        mode: 'html', tid, mk, value: '', \
        $key: '^html', $: 'add_parbreak_markers', }
    p.push window = transforms.$window { min: -2, max: 0, empty: null, }
    p.push add_parbreak_markers = ( [ lookbehind, previous, current, ], send ) ->
      return send current unless ( H.select_token lookbehind,  newline_lx )
      return send current unless ( H.select_token previous,    newline_lx )
      return send current if     ( H.select_token current,     newline_lx )
      send { template..., ( GUY.props.pick_with_fallback current, null, 'lnr1', 'x1', 'lnr2', 'x2', )..., }
      send current
    return p



