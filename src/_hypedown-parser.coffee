

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
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN-PARSER'
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


#-----------------------------------------------------------------------------------------------------------
select_token = ( token, selector ) ->
  return false unless token?
  return false if token.$stamped ? false
  return token.mk is selector




#===========================================================================================================
class Hypedown_transforms extends \
  Hypedown_parser_stars \
  Hypedown_parser_htmlish()

  #---------------------------------------------------------------------------------------------------------
  $show_lexer_tokens: ->
    collector = []
    last      = Symbol 'last'
    H2        = require '../../hengist/dev/hypedown/lib/helpers.js'
    return $ { last, }, ( d ) ->
      if d is last
        return H2.tabulate ( rpr ( t.value for t in collector ) ), collector
      collector.push d
      return null

  #=========================================================================================================
  # PREPARATION
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
      return send current unless ( select_token lookbehind,  newline_lx )
      return send current unless ( select_token previous,    newline_lx )
      return send current if     ( select_token current,     newline_lx )
      send { template..., ( GUY.props.pick_with_fallback current, null, 'lnr1', 'x1', 'lnr2', 'x2', )..., }
      send current
    return p


  #=========================================================================================================
  # PREPARATION
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

  #---------------------------------------------------------------------------------------------------------
  $parse_md_hashes: ({ mode, tid, }) ->
    mode         ?= 'plain'
    tid          ?= 'hashes'
    hashes_mk     = "#{mode}:#{tid}"
    prv_was_empty = false
    return ( d, send ) ->
      return send d unless d.mk is hashes_mk
      send stamp d
      name = "h#{d.data.text.length}"
      send H.XXX_new_token 'parse_md_hashes', d, 'html', 'tag', name, "<#{name}>"
      return null


  #=========================================================================================================
  # FINALIZATION
  #---------------------------------------------------------------------------------------------------------
  $capture_text: ->
    catchall_lx = "plain:other"
    return ( d, send ) ->
      return send d unless select_token d, catchall_lx
      send stamp d
      R = H.XXX_new_token 'capture_text', d, 'html', 'text', d.value, d.value
      R = GUY.lft.lets R, ( R ) ->
        R.lnr1  = d.lnr1
        R.x1    = d.x1
        R.lnr2  = d.lnr2
        R.x2    = d.x2
      send R

  #---------------------------------------------------------------------------------------------------------
  $generate_missing_p_tags: -> ### needs add_parbreak_markers, capture_text ###
    ### NOTE

    * https://stackoverflow.com/questions/8460993/p-end-tag-p-is-not-needed-in-html

    For the time being we opt for *not* using closing `</p>` tags, the reason for this being that they are
    not required by HTML5, and it *may* (just may) make things easier down the line when the closing tag is
    made implicit. However, observe that the very similar `<div>` tag still has to be closed explicitly.

    ###
    parbreak_lx   = "html:parbreak"
    html_text_lx  = "html:text"
    p             = new Pipeline()
    p.push window = transforms.$window { min: -1, max: +1, empty: null, }
    p.push generate_missing_p_tags = ( [ prv, d, nxt, ], send ) ->
      ### TAINT not a correct solution, paragraph could begin with an inline element, so better check for
      nxt being namespace `html`, followed by any content category of `<p>` (i.e. Phrasing Content)

      see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p?retiredLocale=de,
      https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories#phrasing_content ###
      return send d unless select_token prv,  parbreak_lx
      # return send d unless select_token nxt,  html_text_lx
      send H.XXX_new_token 'generate_missing_p_tags', d, 'html', 'text', '<p>', '<p>'
      send d
    return p

  #---------------------------------------------------------------------------------------------------------
  $generate_html_nls: -> ### needs generate_missing_p_tags ###
    newline_lx = "plain:nl"
    return generate_html_nls = ( d, send ) ->
      return send d unless select_token d, newline_lx
      send stamp d
      return if d.data?.virtual ? false
      send H.XXX_new_token 'generate_html_nls', d, 'html', 'text', '\n', '\n'
    return p

  #---------------------------------------------------------------------------------------------------------
  $convert_escaped_chrs: ->
    ### TAINT prelimary ###
    ### TAINT must escape for HTML, so `\<` becomes `&lt;` and so on ###
    ### TAINT must consult registry of escape codes so `\n` -> U+000a but `\a` -> U+0061 ###
    escchr_tid = 'escchr'
    return ( d, send ) ->
      return send d unless d.tid is escchr_tid
      send stamp d
      send H.XXX_new_token 'convert_escaped_chrs', d, d.mode, 'text', d.x.chr, d.x.chr
      # send H.XXX_new_token 'convert_escaped_chrs', d, 'html', 'text', d.x.chr, d.x.chr

  #---------------------------------------------------------------------------------------------------------
  $stamp_borders: -> ( d, send ) -> send if d.tid is '$border' then ( stamp d ) else d


#===========================================================================================================
class Hypedown_parser

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @types        = get_base_types()
    @cfg          = Object.freeze @types.create.hd_parser_cfg cfg
    @lexer        = new Hypedown_lexer()
    # debug '^234^', @lexer
    @_build_pipeline()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _build_pipeline: ->
    tfs       = new Hypedown_transforms()
    @pipeline = new Pipeline()
    #.........................................................................................................
    # @pipeline.push ( d ) -> urge '^_build_pipeline@1^', rpr d
    @pipeline.push tokenize_line = ( line, send ) =>
      # info '^_build_pipeline@2^', rpr line
      # info '^_build_pipeline@3^', ( t for t from @lexer.walk line )
      @types.validate.text line
      send token for token from @lexer.walk line
      return null
    # @pipeline.push ( d ) -> urge '^_build_pipeline@4^', rpr d
    @pipeline.push tfs.$show_lexer_tokens()
    @pipeline.push tfs.$inject_virtual_nl()
    @pipeline.push tfs.$add_parbreak_markers()
    # @pipeline.push ( d ) -> urge '^965-1^', d
    @pipeline.push tfs.$parse_htmlish()
    @pipeline.push tfs.$parse_md_stars()
    @pipeline.push tfs.$parse_md_hashes { mode: 'plain', tid: 'hashes', }
    @pipeline.push tfs.$parse_md_codespan { outer_mode: 'plain', enter_tid: 'codespan', inner_mode: 'cspan', exit_tid: 'codespan', }
    @pipeline.push tfs.$capture_text()
    @pipeline.push tfs.$generate_missing_p_tags()
    @pipeline.push tfs.$generate_html_nls { mode: 'plain', tid: 'nl', } ### NOTE removes virtual nl, should come late ###
    @pipeline.push tfs.$convert_escaped_chrs()
    @pipeline.push tfs.$stamp_borders()
    # @pipeline.push ( d ) -> urge '^_build_pipeline@5^', rpr d
    return null

  #---------------------------------------------------------------------------------------------------------
  send: ( P... ) -> @pipeline.send P...
  run:  ( P... ) -> @pipeline.run  P...
  walk: ( P... ) -> @pipeline.walk P...
  step: ( P... ) -> @pipeline.step P...


#===========================================================================================================
module.exports = { Hypedown_parser, }
