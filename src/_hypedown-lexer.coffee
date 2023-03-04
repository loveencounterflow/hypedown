

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
  @mode: 'plain'

  #---------------------------------------------------------------------------------------------------------
  # @lx_backslash_escape:  { tid: 'escchr', jump: null, pattern: /\\(?<chr>.)/u, reserved: '\\', }



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
    jump_codespan   = "#{@cfg.codespan_mode}["
    #.......................................................................................................
    entry_handler = ({ token, match, lexer, }) =>
      backtick_count = token.value.length
      return jump_codespan
    #.......................................................................................................
    exit_handler = ({ token, match, lexer, }) ->
      if token.value.length is backtick_count
        backtick_count = null
        return '.]'
      ### TAINT setting `token.mk` should not have to be done manually ###
      token = lets token, ( token ) -> token.tid = 'text'; token.mk = "#{token.mode}:text"
      return { token, }
    #.......................................................................................................
    # info '^3531^', @cfg
    return [
      { mode: @cfg.mode,          tid: 'codespan',  jump: entry_handler,  pattern:  /(?<!`)`+(?!`)/u, reserved: '`', }
      { mode: @cfg.codespan_mode, tid: 'codespan',  jump: exit_handler,   pattern:  /(?<!`)`+(?!`)/u, reserved: '`', }
      ( new_nl_descriptor     @cfg.codespan_mode )
      ( new_escchr_descriptor @cfg.codespan_mode )
      ### NOTE this should be produced with `lexer.add_catchall_lexeme()` ###
      # { mode: @cfg.codespan_mode, tid: 'text',      jump: null,           pattern:  /(?:\\`|[^`])+/u,  }
      { mode: @cfg.codespan_mode, tid: 'text',      jump: null,           pattern:  /[^`\\]+/u,  }
      ]

  #---------------------------------------------------------------------------------------------------------
  # @lx_nl:  /$/u

  #---------------------------------------------------------------------------------------------------------
  @lx_star1:  { tid: 'star1', pattern: /(?<!\*)\*(?!\*)/u,      reserved: '*', }
  @lx_star2:  { tid: 'star2', pattern: /(?<!\*)\*\*(?!\*)/u,    reserved: '*', }
  @lx_star3:  { tid: 'star3', pattern: /(?<!\*)\*\*\*(?!\*)/u,  reserved: '*', }

  #---------------------------------------------------------------------------------------------------------
  @lx_hashes:  /^(?<text>#{1,6})($|\s+)/u


#===========================================================================================================
class Hypedown_lexer extends Interlex

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    super { linewise: true, border_tokens: true, }
    _TEMP_add_lexemes @
    standard_sx       = new Standard_sx()
    markdown_sx       = new Markdown_sx { mode: 'plain', codespan_mode: 'cspan', }
    lexemes_lst       = []
    standard_sx.add_lexemes lexemes_lst
    markdown_sx.add_lexemes lexemes_lst
    @add_lexeme lexeme for lexeme in lexemes_lst
    # @add_catchall_lexeme { mode: 'standard', }
    # @add_reserved_lexeme { mode: 'standard', }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  step: ( P... ) ->
    return GUY.lft.lets ( super P... ), ( tokens ) ->
      delete token.source for token in tokens
      return null
    return R

#-----------------------------------------------------------------------------------------------------------
new_escchr_descriptor = ( mode ) ->
  create = ( token ) ->
    token.data = { chr: '\n', } unless ( token.data?.chr )?
    return token
  return { mode, tid: 'escchr', pattern: /\\(?<chr>.|$)/u, reserved: '\\', create, }

#-----------------------------------------------------------------------------------------------------------
new_nl_descriptor = ( mode ) ->
  ### TAINT consider to force value by setting it in descriptor (needs interlex update) ###
  create = ( token ) ->
    token.value = '\n'
    return token
  return { mode, tid: 'nl', pattern: /$/u, create, }

#-----------------------------------------------------------------------------------------------------------
_TEMP_add_lexemes = ( lexer ) ->
  # lexer.add_lexeme { mode, tid: 'eol',      pattern: ( /$/u  ), }
  #.........................................................................................................
  do =>
    mode = 'plain'
    lexer.add_lexeme new_escchr_descriptor  mode
    lexer.add_lexeme new_nl_descriptor      mode
    lexer.add_lexeme { mode,  tid: 'amp',       jump: '[xncr',    pattern: /&(?=[^\s\\]+;)/, reserved: '&', } # only match if ahead of (no ws, no bslash) + semicolon
    lexer.add_lexeme { mode,  tid: 'slash',     jump: null,       pattern: '/',     reserved: '/', }
    lexer.add_lexeme { mode,  tid: 'ltbang',    jump: '[comment', pattern: '<!--',  reserved: '<', }
    lexer.add_lexeme { mode,  tid: 'lt',        jump: '[tag',     pattern: '<',     reserved: '<', }
    lexer.add_lexeme { mode,  tid: 'ws',        jump: null,       pattern: /\s+/u, }
    lexer.add_catchall_lexeme { mode, tid: 'other', concat: true, }
    lexer.add_reserved_lexeme { mode, tid: 'forbidden', concat: true, }
  #.........................................................................................................
  do =>
    mode = 'xncr'
    # lexer.add_lexeme new_escchr_descriptor  mode
    # lexer.add_lexeme new_nl_descriptor      mode
    lexer.add_lexeme { mode,  tid: 'csg',       jump: null,     pattern: /(?<=&)[^\s;#\\]+(?=#)/u, } # character set sigil (non-standard)
    lexer.add_lexeme { mode,  tid: 'name',      jump: null,     pattern: /(?<=&)[^\s;#\\]+(?=;)/u, } # name of named entity
    lexer.add_lexeme { mode,  tid: 'dec',       jump: null,     pattern: /#(?<nr>[0-9]+)(?=;)/u, }
    lexer.add_lexeme { mode,  tid: 'hex',       jump: null,     pattern: /#(?:x|X)(?<nr>[0-9a-fA-F]+)(?=;)/u, }
    lexer.add_lexeme { mode,  tid: 'sc',        jump: '.]',      pattern: /;/u, }
    lexer.add_lexeme { mode,  tid: '$error',    jump: '.]',      pattern: /.|$/u, }
  #.........................................................................................................
  do =>
    mode = 'tag'
    lexer.add_lexeme new_escchr_descriptor  mode
    lexer.add_lexeme new_nl_descriptor      mode
    # lexer.add_lexeme { mode,  tid: 'tagtext',   jump: null,       pattern: ( /[^\/>]+/u ), }
    lexer.add_lexeme { mode,  tid: 'dq',        jump: 'tag:dq[',  pattern: '"',       reserved: '"' }
    lexer.add_lexeme { mode,  tid: 'sq',        jump: 'tag:sq[',  pattern: "'",       reserved: "'" }
    lexer.add_lexeme { mode,  tid: 'slashgt',   jump: '.]',       pattern: '/>',      reserved: [ '>', '/', ] }
    lexer.add_lexeme { mode,  tid: 'slash',     jump: '.]',       pattern: '/',       reserved: '/', }
    lexer.add_lexeme { mode,  tid: 'gt',        jump: '.]',       pattern: '>',       reserved: '>', }
    lexer.add_catchall_lexeme { mode, tid: 'text', concat: true, }
    lexer.add_reserved_lexeme { mode, tid: 'forbidden', concat: true, }
  #.........................................................................................................
  do =>
    mode = 'tag:dq'
    lexer.add_lexeme new_escchr_descriptor  mode
    lexer.add_lexeme new_nl_descriptor      mode
    lexer.add_lexeme { mode,  tid: 'dq',        jump: '].',        pattern: '"',       reserved: '"', }
    lexer.add_catchall_lexeme { mode, tid: 'text', concat: true, }
  #.........................................................................................................
  do =>
    mode = 'tag:sq'
    lexer.add_lexeme new_escchr_descriptor  mode
    lexer.add_lexeme new_nl_descriptor      mode
    lexer.add_lexeme { mode,  tid: 'sq',        jump: '].',        pattern: "'",       reserved: "'", }
    lexer.add_catchall_lexeme { mode, tid: 'text', concat: true, }
  #.........................................................................................................
  do =>
    mode = 'comment'
    lexer.add_lexeme new_escchr_descriptor  mode
    lexer.add_lexeme new_nl_descriptor      mode
    lexer.add_lexeme { mode, tid: 'eoc',       jump: '.]',         pattern:  '-->',    reserved: '--',  }
    lexer.add_catchall_lexeme { mode, tid: 'text', concat: true, }
    lexer.add_reserved_lexeme { mode, tid: 'forbidden', concat: true, }
  return null


#===========================================================================================================
module.exports = {
  _TEMP_add_lexemes
  Markdown_sx
  Standard_sx
  Hypedown_lexer }
