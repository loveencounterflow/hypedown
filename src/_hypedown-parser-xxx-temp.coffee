

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
  Transformer
  $
  transforms }            = require 'moonriver'
#...........................................................................................................
{ misfit
  get_base_types }        = require './types'
E                         = require './errors'
H                         = require './helpers'
{ Hypedown_lexer }        = require './_hypedown-lexer'


#===========================================================================================================
class @$001_prelude extends Transformer


#===========================================================================================================
class @$002_tokenize_lines extends Transformer

  #---------------------------------------------------------------------------------------------------------
  $tokenize_line: ->
    types = get_base_types()
    lexer = new Hypedown_lexer()
    # debug '^3523^', @constructor.name
    return ( line, send ) ->
      # debug '^3523^', @constructor.name
      types.validate.text line
      send token for token from lexer.walk line
      return null

#===========================================================================================================
class @$010_prepare_paragraphs extends Transformer

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
  $consolidate_newlines: -> ### needs inject_virtual_nl ###
    count       = 0
    position    = null
    is_virtual  = null
    stop        = Symbol 'stop'
    template    = { mode: 'plain', tid: 'nls', mk: 'plain:nls', $: 'consolidate_newlines', }
    #.......................................................................................................
    flush = ( send ) =>
      return null if count is 0
      value         = '\n'.repeat count
      position.lnr2 = position.lnr1 + count
      if count > 1
        position.lnr2 = position.lnr1 + count - 1
        position.x2   = 0
      nls         = { template..., value, position..., }
      nls.data    = { virtual: true, } if is_virtual
      count       = 0
      position    = null
      is_virtual  = null
      send nls
    #.......................................................................................................
    return $ { stop, }, consolidate_newlines = ( d, send ) =>
      # debug '^35345^', d.mk, rpr d.value
      return flush send if d is stop
      return send d if d.$stamped
      if d.mk is 'plain:nl'
        count++
        position   ?= H.get_position d
        is_virtual  = if d.data?.virtual then true else false
        urge '^consolidate_newlines@1^', count, position
      else
        flush send
        info '^consolidate_newlines@1^', count, position
        send d
      return null

  #---------------------------------------------------------------------------------------------------------
  $add_parbreak_markers: -> ### needs inject_virtual_nl ###
    newlines_mk = 'plain:nls'
    tid_start   = 'par:start'
    tid_stop    = 'par:stop'
    mk_start    = 'html:par:start'
    mk_stop     = 'html:par:stop'
    stop        = Symbol 'stop'
    has_pars    = false
    #.......................................................................................................
    get_start_token = ( ref ) -> {
      mode:     'html'
      tid:      tid_start
      mk:       mk_start
      value:    ''
      ( H.get_position ref )...
      $:        'add_parbreak_markers' }
    #.......................................................................................................
    get_stop_token = ( ref ) -> {
      mode:     'html'
      tid:      tid_stop
      mk:       mk_stop
      value:    ''
      ( H.get_position ref )...
      $:        'add_parbreak_markers' }
    #-------------------------------------------------------------------------------------------------------
    return class add_parbreak_markers extends Transformer
      $add_stop:              -> $ { stop, }, ( d, send ) -> send d
      $window:                -> transforms.$window { min: 0, max: +1, empty: null, }
      $add_parbreak_markers:  -> ( [ d, nxt, ], send ) ->
        return null if d is stop
        if nxt is stop
          if has_pars
            return send get_stop_token d
          return null
        return send d unless H.select_token d, newlines_mk
        unless d.data?.virtual
          send get_stop_token d
          send d
        send get_start_token d
        has_pars = true

#===========================================================================================================
class @$020_priority_markup extends Transformer
  ### 'Priority markup': markup that blocks parsing of its contents, like codespans, in which stuff like
  stars and double stars do not lead to `<em>`, `<strong>` tags ###

  #---------------------------------------------------------------------------------------------------------
  $parse_md_codespan: ->
    ### TAINT consider to rewrite using `$window()` transform ###
    ### TAINT use CFG pattern ###
    ### TAINT use API for `mode:key` IDs ###
    enter_mk  = "plain:codespan"
    exit_mk   = "cspan:codespan"
    text_mk   = "cspan:text"
    escchr_mk = "cspan:escchr"
    collector = []
    #.......................................................................................................
    flush = ->
      last_idx      = collector.length - 1
      first_txt_idx = 1
      last_txt_idx  = last_idx - 1
      lnr1          = ( collector.at  0 ).lnr1
      lnr2          = ( collector.at -1 ).lnr2
      x1            = ( collector.at  0 ).x1
      x2            = ( collector.at -1 ).x2
      texts         = []
      #.....................................................................................................
      for d, idx in collector
        if ( idx is 0 )
          yield stamp d
          yield H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '<code>'
          continue
        else if ( idx is last_idx )
          yield stamp d
          yield H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '</code>'
          continue
        #...................................................................................................
        switch d.mk
          when text_mk
            if      idx is first_txt_idx  then  texts.push d.value.trimStart()
            else if idx is last_txt_idx   then  texts.push d.value.trimEnd()
            else                                texts.push d.value
          when escchr_mk
            ### TAINT must properly resolve escaped character ###
            texts.push d.data.chr
          else
            throw new Error "^^parse_md_codespan@32", "internal error: unhandled token #{rpr d}"
        #...................................................................................................
        if ( idx is last_txt_idx )
          value = texts.join ''
          ### TAINT should not use `html` or must escape first ###
          yield { mode: 'html', tid: 'text', mk: 'html:text', value, lnr1, x1, lnr2, x2, }
      #.....................................................................................................
      collector.length = 0
      return null
    #.......................................................................................................
    return parse_md_codespan = ( d, send ) ->
      switch d.mk
        when enter_mk, text_mk, escchr_mk
          send stamp d
          collector.push d
        when exit_mk
          collector.push d
          send e for e from flush()
        else
          send d
      return null


#===========================================================================================================
class @$030_htmlish_tags extends Transformer
  $: ( require './_hypedown-parser-htmlish' ).Hypedown_parser_htmlish


#===========================================================================================================
class @$040_stars extends Transformer
  $: ( require './_hypedown-parser-stars' ).Hypedown_parser_md_stars


#===========================================================================================================
class @$050_hash_headings extends Transformer
  $: ->
    mode          = 'plain'
    tid           = 'hashes'
    hashes_mk     = "#{mode}:#{tid}"
    parbreak_mk   = 'html:parbreak'
    prv_was_empty = false
    p             = new Pipeline()
    p.push window = transforms.$window { min: -1, max: 0, empty: null, }
    p.push add_headings = ( [ previous, d, ], send ) ->
      return send d unless ( previous?.mk is parbreak_mk ) and ( d.mk is hashes_mk )
      send stamp d
      name = "h#{d.data.text.length}"
      send H.XXX_new_token '050_hash_headings', d, 'html', 'tag', name, "<#{name}>"
      return null
    return p

