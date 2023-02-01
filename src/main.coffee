

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
  stamp     }             = DATOM
#...........................................................................................................
{ Pipeline,         \
  $,
  transforms, }           = require 'moonriver'
#...........................................................................................................
{ Interlex
  Syntax
  compose  }              = require 'intertext-lexer'
#...........................................................................................................
{ misfit
  jump_symbol
  get_base_types }        = require './types'
E                         = require './errors'


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
  @lx_backslash_escape:  { tid: 'escchr', jump: null, pattern: /\\(?<chr>.)/u, }
  @lx_catchall:          { tid: 'other',  jump: null, pattern: /[^*`\\]+/u, }
  @lx_foo: 'foo'
  @lx_bar: /bar/
  @lx_something: [ 'foo', /bar/, 'baz', ]
  @lx_xxx: -> 'xxx'


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
      { mode: @cfg.mode,          tid: 'codespan',  jump: entry_handler,  pattern:  /(?<!`)`+(?!`)/u,   }
      { mode: @cfg.codespan_mode, tid: 'codespan',  jump: exit_handler,   pattern:  /(?<!`)`+(?!`)/u,   }
      { mode: @cfg.codespan_mode, tid: 'text',      jump: null,           pattern:  /(?:\\`|[^`])+/u,   }
      ]

  #---------------------------------------------------------------------------------------------------------
  @lx_star1:  /(?<!\*)\*(?!\*)/u


#===========================================================================================================
class Hypedown_lexer extends Interlex

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    super { dotall: false, }
    standard_sx       = new Standard_sx()
    markdown_sx       = new Markdown_sx { mode: 'standard', codespan_mode: 'cspan', }
    lexemes_lst       = []
    standard_sx.add_lexemes lexemes_lst
    markdown_sx.add_lexemes lexemes_lst
    @add_lexeme lexeme for lexeme in lexemes_lst
    return undefined


#===========================================================================================================
class Hypedown_transforms

  #---------------------------------------------------------------------------------------------------------
  $parse_md_codespan: ( outer_mode, enter_tid, inner_mode, exit_tid ) ->
    ### TAINT use CFG pattern ###
    ### TAINT use API for `mode:key` IDs ###
    enter_mk  = "#{outer_mode}:#{enter_tid}"
    exit_mk   = "#{inner_mode}:#{exit_tid}"
    return ( d, send ) ->
      switch d.mk
        when enter_mk
          send stamp d
          send XXX_new_token '^æ2^', d, 'html', 'tag', 'code', '<code>'
        when exit_mk
          send stamp d
          send XXX_new_token '^æ1^', d, 'html', 'tag', 'code', '</code>'
        else
          send d
      return null

  #---------------------------------------------------------------------------------------------------------
  $parse_md_star: ({ star1_tid }) ->
    ### TAINT use CFG pattern ###
    #.......................................................................................................
    within =
      one:    false
    start_of =
      one:    null
    #.......................................................................................................
    enter = ( mode, start ) ->
      within[   mode ] = true
      start_of[ mode ] = start
      return null
    enter.one = ( start ) -> enter 'one', start
    #.......................................................................................................
    exit = ( mode ) ->
      within[   mode ] = false
      start_of[ mode ] = null
      return null
    exit.one = -> exit 'one'
    #.......................................................................................................
    return ( d, send ) ->
      switch d.tid
        #...................................................................................................
        when star1_tid
          send stamp d
          if within.one then  exit.one();         send XXX_new_token '^æ1^', d, 'html', 'tag', 'i', '</i>'
          else                enter.one d.start;  send XXX_new_token '^æ2^', d, 'html', 'tag', 'i', '<i>'
        #...................................................................................................
        else send d
      return null



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
    @pipeline.push ( d, send ) =>
      return send d unless d.tid is 'p'
      send e for e from @lexer.walk d.value
    @pipeline.push tfs.$parse_md_star { star1_tid: 'star1', }
    @pipeline.push tfs.$parse_md_codespan { \
      outer_mode: 'standard', enter_tid: 'codespan', inner_mode: 'codespan', exit_tid: 'codespan', }
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
