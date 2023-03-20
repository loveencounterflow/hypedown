

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
    newline_mk  = 'plain:nl'
    mk          = 'html:parbreak'
    p           = new Pipeline()
    template    = { \
        mode: 'html', tid: 'parbreak', mk, value: '', \
        $key: '^html', $: 'add_parbreak_markers', }
    p.push ( d ) -> info '^3242^', d
    p.push window = transforms.$window { min: -3, max: +3, empty: null, }
    p.push ( ds, send ) -> help '^3242^', d?.mk ? '---' for d in ds; send ds.at 3
    p.push window = transforms.$window { min: -2, max: 0, empty: null, }
    p.push ( ds ) -> urge '^3242^', d?.mk ? '---' for d in ds
    p.push ( ds, send ) -> send ds.at -1
    # p.push add_parbreak_markers = ( [ lookbehind, previous, current, ], send ) ->
    #   debug '^3242^', [ lookbehind?.mk, previous?.mk, current?.mk, ]
    #   debug '^3242^', previous if previous? and not previous.mk?
    #   return send current unless ( H.select_token lookbehind,  newline_mk )
    #   return send current unless ( H.select_token previous,    newline_mk )
    #   return send current if     ( H.select_token current,     newline_mk )
    #   send { template..., ( GUY.props.pick_with_fallback current, null, 'lnr1', 'x1', 'lnr2', 'x2', )..., }
    #   send current
    return p

#===========================================================================================================
class @$020_priority_markup extends Pipeline_module
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
class @$030_htmlish_tags extends Pipeline_module
  $: ( require './_hypedown-parser-htmlish' ).Hypedown_parser_htmlish


#===========================================================================================================
class @$040_stars extends Pipeline_module
  $: ( require './_hypedown-parser-stars' ).Hypedown_parser_md_stars


#===========================================================================================================
class @$050_hash_headings extends Pipeline_module
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

