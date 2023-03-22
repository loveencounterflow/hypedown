

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
XXX_TEMP                  = require './_hypedown-parser-xxx-temp'
{ XXX_Hypedown_transforms }   = require './_hypedown-parser-xxx-transforms'



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
    tfs       = new XXX_Hypedown_transforms()
    @pipeline = new Pipeline()
    #.........................................................................................................
    @pipeline.push new XXX_TEMP.$001_Prelude()
    @pipeline.push tokenize_line = ( line, send ) =>
      @types.validate.text line
      send token for token from @lexer.walk line
      return null
    # @pipeline.push tfs.$show_lexer_tokens()
    @pipeline.push new XXX_TEMP.$010_prepare_paragraphs()
    @pipeline.push new XXX_TEMP.$020_priority_markup()
    @pipeline.push new XXX_TEMP.$030_htmlish_tags()
    @pipeline.push new XXX_TEMP.$040_stars()
    @pipeline.push new XXX_TEMP.$050_hash_headings()
    @pipeline.push tfs.$capture_text()
    @pipeline.push tfs.$generate_missing_p_tags()
    @pipeline.push tfs.$generate_html_nls { mode: 'plain', tid: 'nl', } ### NOTE removes virtual nl, should come late ###
    @pipeline.push tfs.$convert_escaped_chrs()
    @pipeline.push tfs.$stamp_borders()
    # @pipeline.push ( d ) -> urge '^_build_pipeline@5^', rpr d
    return null

  #---------------------------------------------------------------------------------------------------------
  send:       ( P... ) -> @pipeline.send P...
  run:        ( P... ) -> @pipeline.run  P...
  walk:       ( P... ) -> @pipeline.walk P...
  stop_walk:  ( P... ) -> @pipeline.stop_walk P...
  step:       ( P... ) -> @pipeline.step P...


#===========================================================================================================
module.exports = { Hypedown_parser, }
