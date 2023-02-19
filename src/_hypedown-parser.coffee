

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
{ Hypedown_transforms_stars } \
                          = require './_hypedown-transforms-stars'
{ Hypedown_lexer }        = require './_hypedown-lexer'


#-----------------------------------------------------------------------------------------------------------
select_token = ( token, selector ) ->
  return false unless token?
  return false if token.$stamped ? false
  return token.mk is selector




#===========================================================================================================
### TAINT temporary quick fix solution; might use mixins or similar in the future ###
class Hypedown_transforms extends Hypedown_transforms_stars


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
      send { mode, tid, mk, jump: null, value: '', start: 0, stop: 0, \
        x: { virtual: true, }, $key: '^plain', $: 'inject_virtual_nl', }
      send { mode, tid, mk, jump: null, value: '', start: 0, stop: 0, \
        x: { virtual: true, }, $key: '^plain', $: 'inject_virtual_nl', }
      send d

  #---------------------------------------------------------------------------------------------------------
  $add_parbreak_markers: -> ### needs inject_virtual_nl ###
    mode        = 'plain'
    newline_lx  = "#{mode}:nl"
    tid         = 'parbreak'
    mk          = "html:#{tid}"
    p           = new Pipeline()
    template    = { \
        mode: 'html', tid, mk, value: '', start: 0, stop: 0, \
        $key: '^html', $: 'add_parbreak_markers', }
    p.push window = transforms.$window { min: -2, max: 0, empty: null, }
    p.push add_parbreak_markers = ( [ lookbehind, previous, current, ], send ) ->
      return send current unless ( select_token lookbehind,  newline_lx )
      return send current unless ( select_token previous,    newline_lx )
      return send current if     ( select_token current,     newline_lx )
      { start
        stop  } = current
      send { template..., start, stop, }
      send current
    return p


  #=========================================================================================================
  # PREPARATION
  #---------------------------------------------------------------------------------------------------------
  $parse_md_codespan: ({ outer_mode, enter_tid, inner_mode, exit_tid }) ->
    ### TAINT use CFG pattern ###
    ### TAINT use API for `mode:key` IDs ###
    enter_mk  = "#{outer_mode}:#{enter_tid}"
    exit_mk   = "#{inner_mode}:#{exit_tid}"
    text_mk   = "#{inner_mode}:text"
    return ( d, send ) ->
      switch d.mk
        when enter_mk
          send stamp d
          send H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '<code>'
        when exit_mk
          send stamp d
          send H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '</code>'
        when text_mk
          send stamp d
          ### TAINT should `text` be escaped? ###
          send H.XXX_new_token 'parse_md_codespan', d, 'html', 'text', null, d.value
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
      name = "h#{d.x.text.length}"
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
      send H.XXX_new_token 'capture_text', d, 'html', 'text', d.value, d.value

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
      return if d.x?.virtual ? false
      send H.XXX_new_token 'generate_html_nls', d, 'html', 'text', '\n', '\n'
    return p


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
    @pipeline.push ( line, send ) =>
      return send line unless @types.isa.text line
      # info '^211231^', rpr line
      send token for token from @lexer.walk line
      return null
    @pipeline.push tfs.$inject_virtual_nl()
    @pipeline.push tfs.$add_parbreak_markers()
    # @pipeline.push ( d ) -> urge '^965-1^', d
    @pipeline.push tfs.$parse_md_stars()
    @pipeline.push tfs.$parse_md_hashes { mode: 'plain', tid: 'hashes', }
    @pipeline.push tfs.$parse_md_codespan { \
      outer_mode: 'plain', enter_tid: 'codespan', inner_mode: 'cspan', exit_tid: 'codespan', }
    @pipeline.push tfs.$capture_text()
    @pipeline.push tfs.$generate_missing_p_tags()
    @pipeline.push tfs.$generate_html_nls { mode: 'plain', tid: 'nl', } ### NOTE removes virtual nl, should come late ###
    return null

  #---------------------------------------------------------------------------------------------------------
  send: ( P... ) -> @pipeline.send P...
  run:  ( P... ) -> @pipeline.run  P...
  walk: ( P... ) -> @pipeline.walk P...
  step: ( P... ) -> @pipeline.step P...


#===========================================================================================================
module.exports = { Hypedown_parser, }
