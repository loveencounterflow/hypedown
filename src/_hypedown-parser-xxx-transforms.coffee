

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
{ Hypedown_lexer }        = require './_hypedown-lexer'
XXX_TEMP                  = require './_hypedown-parser-xxx-temp'


#===========================================================================================================
class XXX_Hypedown_transforms

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
      return send d unless H.select_token d, catchall_lx
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
      return send d unless H.select_token prv,  parbreak_lx
      # return send d unless H.select_token nxt,  html_text_lx
      # send H.XXX_new_token 'generate_missing_p_tags', d, 'html', 'text', '<p>', '<p>'
      { lnr1, x1, } = d
      send { mode: 'html', tid: 'text', mk: 'html:text', value: '<p>', lnr1, x1, lnr2: lnr1, x2: x1, }
      send d
    return p

  #---------------------------------------------------------------------------------------------------------
  $generate_html_nls: -> ### needs generate_missing_p_tags ###
    newline_lx = "plain:nl"
    return generate_html_nls = ( d, send ) ->
      return send d unless H.select_token d, newline_lx
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
      return send d if d.$stamped
      return send d unless d.tid is escchr_tid
      send stamp d
      send H.XXX_new_token 'convert_escaped_chrs', d, d.mode, 'text', d.data.chr, d.data.chr
      # send H.XXX_new_token 'convert_escaped_chrs', d, 'html', 'text', d.data.chr, d.data.chr

  #---------------------------------------------------------------------------------------------------------
  $stamp_borders: -> ( d, send ) -> send if d.tid is '$border' then ( stamp d ) else d



#===========================================================================================================
module.exports = { XXX_Hypedown_transforms, }
