

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
{ Interlex
  Syntax
  compose  }              = require 'intertext-lexer'
#...........................................................................................................
{ misfit
  jump_symbol
  get_base_types }        = require './types'
E                         = require './errors'
types                     = new ( require 'intertype' ).Intertype
{ Hypedown_transforms_stars } \
                          = require './_hypedown-transforms-stars'


#-----------------------------------------------------------------------------------------------------------
select_token = ( token, selector ) ->
  return false unless token?
  return false if token.$stamped ? false
  return token.mk is selector

#-----------------------------------------------------------------------------------------------------------
XXX_new_token = ( ref, token, mode, tid, name, value, start, stop, x = null, lexeme = null ) ->
  ### TAINT recreation of `Interlex::XXX_new_token()` ###
  jump      = lexeme?.jump ? null
  { start
    stop  } = token
  return new_datom "^#{mode}", { mode, tid, mk: "#{mode}:#{tid}", jump, name, value, start, stop, x, $: ref, }



#===========================================================================================================
class Standard_sx extends Syntax

  #---------------------------------------------------------------------------------------------------------
  @mode: 'standard'

  #---------------------------------------------------------------------------------------------------------
  @lx_backslash_escape:  { tid: 'escchr', jump: null, pattern: /\\(?<chr>.)/u, reserved: '\\', }
  ### TAINT use 'forbidden chrs' (to be implemented) ###
  # @lx_catchall:          { tid: 'other',  jump: null, pattern: /[^*`\\#]+/u, }

  # @lx_foo: 'foo'
  # @lx_bar: /bar/
  # @lx_something: [ 'foo', /bar/, 'baz', ]
  # @lx_xxx: -> 'xxx'


#===========================================================================================================
class Markdown_sx extends Syntax

  #---------------------------------------------------------------------------------------------------------
  ### TAINT handle CFG format which in this case includes `codespan_mode` ###
  constructor: ( cfg ) ->
    super { codespan_mode: 'codespan', cfg..., }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  @lx_variable_codespan: ( cfg ) ->
    backtick_count  = null
    #.......................................................................................................
    entry_handler = ({ token, match, lexer, }) =>
      backtick_count = token.value.length
      return @cfg.codespan_mode
    #.......................................................................................................
    exit_handler = ({ token, match, lexer, }) ->
      if token.value.length is backtick_count
        backtick_count = null
        return '^'
      ### TAINT setting `token.mk` should not have to be done manually ###
      token = lets token, ( token ) -> token.tid = 'text'; token.mk = "#{token.mode}:text"
      return { token, }
    #.......................................................................................................
    # info '^3531^', @cfg
    return [
      { mode: @cfg.mode,          tid: 'codespan',  jump: entry_handler,  pattern:  /(?<!`)`+(?!`)/u, reserved: '`', }
      { mode: @cfg.codespan_mode, tid: 'codespan',  jump: exit_handler,   pattern:  /(?<!`)`+(?!`)/u, reserved: '`', }
      ### NOTE this could be produced with `lexer.add_catchall_lexeme()` ###
      { mode: @cfg.codespan_mode, tid: 'text',      jump: null,           pattern:  /(?:\\`|[^`])+/u,  }
      ]

  #---------------------------------------------------------------------------------------------------------
  @lx_nl:  /$/u

  #---------------------------------------------------------------------------------------------------------
  @lx_star1:  /(?<!\*)\*(?!\*)/u
  @lx_star2:  /(?<!\*)\*\*(?!\*)/u
  @lx_star3:  /(?<!\*)\*\*\*(?!\*)/u

  #---------------------------------------------------------------------------------------------------------
  @lx_hashes:  /^(?<text>#{1,6})($|\s+)/u


#===========================================================================================================
class Hypedown_lexer extends Interlex

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    super { catchall_concat: true, reserved_concat: true, }
    standard_sx       = new Standard_sx()
    markdown_sx       = new Markdown_sx { mode: 'standard', codespan_mode: 'cspan', }
    lexemes_lst       = []
    standard_sx.add_lexemes lexemes_lst
    markdown_sx.add_lexemes lexemes_lst
    @add_lexeme lexeme for lexeme in lexemes_lst
    @add_catchall_lexeme { mode: 'standard', }
    @add_reserved_lexeme { mode: 'standard', }
    return undefined


#===========================================================================================================
### TAINT temporary quick fix solution; might use mixins or similar in the future ###
class Hypedown_transforms extends Hypedown_transforms_stars


  #=========================================================================================================
  # PREPARATION
  #---------------------------------------------------------------------------------------------------------
  $inject_virtual_nl: ->
    ### normalize start of document by injecting two newlines. ###
    is_first  = true
    mode      = 'standard'
    tid       = 'nl'
    mk        = "#{mode}:#{tid}"
    return ( d, send ) ->
      return send d unless is_first
      is_first = false
      send { mode, tid, mk, jump: null, value: '', start: 0, stop: 0, \
        x: { virtual: true, }, $key: '^standard', $: 'inject_virtual_nl', }
      send { mode, tid, mk, jump: null, value: '', start: 0, stop: 0, \
        x: { virtual: true, }, $key: '^standard', $: 'inject_virtual_nl', }
      send d

  #---------------------------------------------------------------------------------------------------------
  $add_parbreak_markers: -> ### needs inject_virtual_nl ###
    is_first  = true
    mode      = 'standard'
    mk        = "standard:nl"
    p         = new Pipeline()
    p.push window = transforms.$window { min: -2, max: 0, empty: null, }
    p.push add_parbreak_markers = ( [ lookbehind, previous, current, ], send ) ->
      send current
      # debug '^98-75^', mk, ( lookbehind?.mk ? '---' ), ( previous?.mk ? '---' ), ( previous?.mk ? '---' ), ( select_token previous, mk ), ( select_token current, mk )
      return if ( select_token lookbehind, mk )
      return unless ( select_token previous, mk ) and ( select_token current, mk )
      # unless d.mk is mk
      send { \
        mode, tid: 'p', mk: "#{mode}:p", jump: null, value: '', start: 0, stop: 0, \
        $key: '^standard', $: 'add_parbreak_markers', }
    return p


  #=========================================================================================================
  # PREPARATION
  #---------------------------------------------------------------------------------------------------------
  $parse_md_codespan: ({ outer_mode, enter_tid, inner_mode, exit_tid }) ->
    ### TAINT use CFG pattern ###
    ### TAINT use API for `mode:key` IDs ###
    enter_mk  = "#{outer_mode}:#{enter_tid}"
    exit_mk   = "#{inner_mode}:#{exit_tid}"
    return ( d, send ) ->
      switch d.mk
        when enter_mk
          send stamp d
          send XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '<code>'
        when exit_mk
          send stamp d
          send XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '</code>'
        else
          send d
      return null

  #---------------------------------------------------------------------------------------------------------
  $parse_md_hashes: ({ mode, tid, }) ->
    mode         ?= 'standard'
    tid          ?= 'hashes'
    hashes_mk     = "#{mode}:#{tid}"
    prv_was_empty = false
    return ( d, send ) ->
      return send d unless d.mk is hashes_mk
      send stamp d
      name = "h#{d.x.text.length}"
      send XXX_new_token 'parse_md_hashes', d, 'html', 'tag', name, "<#{name}>"
      return null


  #=========================================================================================================
  # FINALIZATION
  #---------------------------------------------------------------------------------------------------------
  $generate_p_tags: ({ mode, tid }) -> ### precedes generate_html_nls, needs add_parbreak_markers ###
    ### NOTE

    * https://stackoverflow.com/questions/8460993/p-end-tag-p-is-not-needed-in-html

    For the time being we opt for *not* using closing `</p>` tags, the reason for this being that they are
    not required by HTML5, and it *may* (just may) make things easier down the line when the closing tag is
    made implicit. However, observe that the very similar `<div>` tag still has to be closed explicitly.

    ###
    mk        = "#{mode}:#{tid}"
    return ( d, send ) ->
      # debug '^generate_html_nls@1^', d
      return send d unless d.mk is mk
      send stamp d
      send XXX_new_token 'generate_p_tags', d, 'html', 'text', '<p>', '<p>'

  #---------------------------------------------------------------------------------------------------------
  $capture_text: ->
    mk        = "standard:#$catchall"
    return ( d, send ) ->
      return send d unless select_token d, mk
      send stamp d
      send XXX_new_token 'capture_text', d, 'html', 'text', d.value, d.value

  #---------------------------------------------------------------------------------------------------------
  $generate_html_nls: -> ### needs generate_p_tags ###
    mk        = "standard:nl"
    p         = new Pipeline()
    p.push window           = transforms.$window { min: -2, max: 0, empty: null, }
    p.push ( [ previous, current, next, ], send ) ->
      debug '^generate_html_nls@1^', [ previous?.mk, previous?.value, ],[ current?.mk, current?.value, ],[ next?.mk, next?.value, ]
      return unless current?
      return send current
      return send d unless d.mk is mk
      send stamp d
      return if d.x?.virtual ? false
      send XXX_new_token 'generate_html_nls', d, 'html', 'text', '\n', '\n'
    return p


#===========================================================================================================
class Hypedown_parser

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @types        = get_base_types()
    @cfg          = Object.freeze @types.create.hd_parser_cfg cfg
    @lexer        = new Hypedown_lexer { mode: 'standard', }
    # debug '^234^', @lexer
    @_build_pipeline()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _build_pipeline: ->
    tfs       = new Hypedown_transforms()
    @pipeline = new Pipeline()
    @pipeline.push ( line, send ) =>
      return send line unless types.isa.text line
      # info '^211231^', rpr line
      send token for token from @lexer.walk line
    @pipeline.push tfs.$inject_virtual_nl()
    @pipeline.push tfs.$add_parbreak_markers()
    # @pipeline.push ( d ) -> urge '^965-1^', d
    @pipeline.push tfs.$parse_md_stars()
    @pipeline.push tfs.$parse_md_hashes { mode: 'standard', tid: 'hashes', }
    @pipeline.push tfs.$parse_md_codespan { \
      outer_mode: 'standard', enter_tid: 'codespan', inner_mode: 'cspan', exit_tid: 'codespan', }
    @pipeline.push tfs.$capture_text()
    @pipeline.push tfs.$generate_p_tags { mode: 'standard', tid: 'p', }
    @pipeline.push tfs.$generate_html_nls { mode: 'standard', tid: 'nl', } ### NOTE removes virtual nl, should come late ###
    return null

  #---------------------------------------------------------------------------------------------------------
  send: ( P... ) -> @pipeline.send P...
  run:  ( P... ) -> @pipeline.run  P...
  walk: ( P... ) -> @pipeline.walk P...
  step: ( P... ) -> @pipeline.step P...


#===========================================================================================================
module.exports = {
  XXX_new_token
  Interlex
  Syntax
  Standard_sx
  Markdown_sx
  Hypedown_lexer
  Hypedown_parser }
