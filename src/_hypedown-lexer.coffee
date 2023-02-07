

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
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN/HYPEDOWN-LEXER'
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
{ Interlex
  Syntax
  compose  }              = require 'intertext-lexer'
#...........................................................................................................
{ misfit
  get_base_types }        = require './types'
E                         = require './errors'


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
module.exports = {
  Markdown_sx
  Standard_sx
  Hypedown_lexer }
