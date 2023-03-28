

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
  $consolidate_newlines: ->
    count       = 0
    position    = null
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
      data          = { count, }
      nls           = { template..., value, data, position..., }
      count         = 0
      position      = null
      send nls
    #.......................................................................................................
    return $ { stop, }, consolidate_newlines = ( d, send ) =>
      return flush send if d is stop
      return send d if d.$stamped
      if d.mk is 'plain:nl'
        count++
        position   ?= H.get_position d
      else
        flush send
        send d
      return null

  #---------------------------------------------------------------------------------------------------------
  $inject_starter: ->
    is_first  = true
    mode      = 'prep'
    tid       = 'starter'
    mk        = "#{mode}:#{tid}"
    return ( d, send ) ->
      return send d unless is_first
      return send d if /^\s*$/.test d.value
      is_first = false
      send { d..., mode, tid, mk, jump: null, value: '', $: 'inject_starter', }
      send d

  #---------------------------------------------------------------------------------------------------------
  $add_parbreak_markers: ->
    newlines_mk   = 'plain:nls'
    tid_start     = 'par:start'
    tid_stop      = 'par:stop'
    par_start_mk  = 'html:par:start'
    par_stop_mk   = 'html:par:stop'
    stop          = Symbol 'stop'
    has_pars      = false
    started       = false
    #.......................................................................................................
    get_start_token = ( ref ) -> {
      mode:     'html'
      tid:      tid_start
      mk:       par_start_mk
      value:    ''
      ( H.get_position ref )...
      $:        'add_parbreak_markers' }
    #.......................................................................................................
    get_stop_token = ( ref ) -> {
      mode:     'html'
      tid:      tid_stop
      mk:       par_stop_mk
      value:    ''
      ( H.get_position ref )...
      $:        'add_parbreak_markers' }
    #-------------------------------------------------------------------------------------------------------
    return class add_parbreak_markers extends Transformer
      $add_stop:              -> $ { stop, }, ( d, send ) -> send d
      $window:                -> transforms.$window { min: 0, max: +1, empty: null, }
      $add_parbreak_markers:  -> ( [ d, nxt, ], send ) ->
        return null if d is stop
        if d.mk is 'prep:starter'
          send stamp d
          started = true
        return send d unless started
        if nxt is stop
          if has_pars
            send get_stop_token d
          return send d
        return send d unless ( d.mk is 'prep:starter' ) or ( H.select_token d, newlines_mk ) and ( d.data.count > 1 )
        send get_stop_token d if has_pars
        send d unless d.mk is 'prep:starter'
        send get_start_token d
        has_pars = true
        return null

  # $show_1: -> show_1 = ( d ) -> info d

#===========================================================================================================
class @$020_priority_markup extends Transformer
  ### 'Priority markup': markup that blocks parsing of its contents, like codespans, in which stuff like
  stars and double stars do not lead to `<em>`, `<strong>` tags ###

  #---------------------------------------------------------------------------------------------------------
  $parse_md_codespan: ->
    ### TAINT consider to rewrite using `$window()` transform ###
    ### TAINT use CFG pattern ###
    ### TAINT use API for `mode:key` IDs ###
    enter_mk  = 'cspan:start'
    text_mk   = 'cspan:text'
    nl_mk     = 'cspan:nl'
    escchr_mk = 'cspan:escchr'
    exit_mk   = 'cspan:stop'
    collector = []
    stop      = Symbol 'stop'
    #.......................................................................................................
    $flush = ->
      class Flush extends Transformer
        $source: -> collector
        $show_1: -> ( d ) ->
          urge '^flush.show_1^', collector.length, d
        $on_stop: -> $ { stop }, ( d ) ->
          collector.length = 0 if d is stop
      return Flush.as_pipeline()
    _flush = $flush()
    flush = -> yield from _flush.walk_and_stop()
    # #.......................................................................................................
    # flush = ->
    #   last_idx      = collector.length - 1
    #   first_txt_idx = 1
    #   last_txt_idx  = last_idx - 1
    #   lnr1          = ( collector.at  0 ).lnr1
    #   lnr2          = ( collector.at -1 ).lnr2
    #   x1            = ( collector.at  0 ).x1
    #   x2            = ( collector.at -1 ).x2
    #   texts         = []
    #   #.....................................................................................................
    #   for d, idx in collector
    #     urge '^flush^', d.mk, ( rpr d.value ), ( idx is 0 ), ( idx is last_idx )
    #     if ( idx is 0 )
    #       yield stamp d
    #       yield H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '<code>'
    #       continue
    #     #...................................................................................................
    #     switch d.mk
    #       when text_mk
    #         if      idx is first_txt_idx  then  texts.push d.value.trimStart()
    #         else if idx is last_txt_idx   then  texts.push d.value.trimEnd()
    #         else                                texts.push d.value
    #       when escchr_mk
    #         ### TAINT must properly resolve escaped character ###
    #         texts.push d.data.chr
    #       else
    #         throw new Error "^^parse_md_codespan@32", "internal error: unhandled token #{rpr d}"
    #     #...................................................................................................
    #     if ( idx is last_txt_idx )
    #       value = texts.join ''
    #       ### TAINT should not use `html` or must escape first ###
    #       yield { mode: 'html', tid: 'text', mk: 'html:text', value, lnr1, x1, lnr2, x2, }
    #   ### TAINT must account for case when parsing ends before closing markup ###
    #   yield H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '</code>'
    #   #.....................................................................................................
    #   collector.length = 0
    #   return null
    #.......................................................................................................
    return parse_md_codespan = $ { stop }, ( d, send ) ->
      if d is stop
        send e for e from flush()
        return null
      #.....................................................................................................
      switch d.mk
        when enter_mk, text_mk, nl_mk, escchr_mk
          send stamp d
          collector.push d
        when exit_mk
          collector.push d
          send e for e from flush()
        else
          send d
      #.....................................................................................................
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
    hashes_mk     = "plain:hashes"
    par_start_mk  = 'html:par:start'
    par_stop_mk   = 'html:par:stop'
    prv_was_empty = false
    within_h      = false
    level         = null
    position      = null
    #.......................................................................................................
    get_start_token = ({ ref, name, level, }) ->
      return {
        mode:     'html'
        tid:      'p:start'
        mk:       'html:h:start'
        data:     { name, level, }
        value:    "<#{name}>"
        ( H.get_position ref )...
        $:        '050_hash_headings' }
    #.......................................................................................................
    get_stop_token = ({ ref, name, level, }) ->
      position_2    = H.get_position ref
      position.lnr2 = position_2.lnr2
      position.x2   = position_2.x2
      return {
        mode:     'html'
        tid:      'p:stop'
        mk:       'html:h:stop'
        data:     { name, level, }
        value:    "</#{name}>"
        position...
        $:        '050_hash_headings' }
    #-------------------------------------------------------------------------------------------------------
    return class add_headings_markup extends Transformer
      $window:        -> transforms.$window { min: -1, max: +1, empty: null, }
      $add_headings:  -> ( [ prv, d, nxt, ], send ) ->
        if ( prv?.mk is par_start_mk ) and ( d.mk is hashes_mk )
          send stamp d
          position  = H.get_position d
          within_h  = true
          level     = d.data.text.length
          name      = "h#{level}"
          send get_start_token { ref: d, name, level, }
        else if within_h and ( nxt?.mk is par_stop_mk )
          send d
          name      = "h#{level}"
          send get_stop_token { ref: d, name, level, }
          level     = null
          within_h  = false
          position  = null
        else
          send d
        return null

