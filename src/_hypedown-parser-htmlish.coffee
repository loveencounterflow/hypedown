

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
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN-PARSER/HTMLISH'
#...........................................................................................................
{ rpr
  inspect
  echo
  log     }               = GUY.trm
#...........................................................................................................
{ Pipeline
  transforms  } = require 'moonriver'
HTMLISH        = ( require 'paragate/lib/htmlish.grammar' ).new_grammar { bare: true, }
htmlish_sym     = Symbol 'htmlish'
#...........................................................................................................
{ DATOM }                 = require 'datom'
#...........................................................................................................
{ new_datom
  lets
  stamp }                = DATOM


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@Hypedown_parser_htmlish = ( clasz = Object ) => class extends clasz

  #---------------------------------------------------------------------------------------------------------
  $parse_htmlish: ->
    return ( d ) -> urge '^parse_htmlish@1^', d


#-----------------------------------------------------------------------------------------------------------
new_parser = ( lexer ) ->
  #.........................................................................................................
  $tokenize     = ( parser ) ->
    return tokenize = ( line, send ) ->
      @types.validate.text line
      send token for token from parser.lexer.walk line
      return null
  #.........................................................................................................
  $_hd_token_from_paragate_token = ->
    return _hd_token_from_paragate_token = ( d, send ) ->
      return send d unless d[htmlish_sym]?
      first = d.$collector.at  0
      last  = d.$collector.at -1
      # delete d.$collector; H.tabulate "htmlish", [ d, ]
      #.....................................................................................................
      #
      # * otag      opening tag, `<a>`
      # * ctag      closing tag, `</a>` or `</>`
      #
      # * ntag      opening tag of `<i/italic/`
      # * nctag     closing slash of `<i/italic/`
      #
      # * stag      self-closing tag, `<br/>`
      #
      tag_types =
        otag:       { open: true,  close: false, }
        ctag:       { open: false, close: true,  }
        ntag:       { open: true,  close: false, }
        nctag:      { open: false, close: true,  }
        stag:       { open: true,  close: true,  }
      #.....................................................................................................
      e     =
        mode:   'tag'
        tid:    d.type
        mk:     "tag:#{d.type}"
        jump:   null
        value:  d.$source
        ### TAINT must give first_lnr, last_lnr ###
        lnr:    first.lnr
        start:  first.start
        stop:   last.stop
        x:
          atrs:   d.atrs
          id:     d.id
        source: null
        $key:   '^tag'
      send e
    return null
  #.........................................................................................................
  $parse_htmlish_tag  = ->
    collector   = []
    within_tag  = false
    sp          = new Pipeline()
    sp.push transforms.$window { min: 0, max: +1, empty: null, }
    sp.push parse_htmlish_tag = ( [ d, nxt, ], send ) ->
      #.....................................................................................................
      if within_tag
        collector.push d
        # debug '^parse_htmlish_tag@1^', d
        if d.jump is 'plain' ### TAINT magic number ###
          within_tag  = false
          $source     = ( e.value for e from collector ).join ''
          $collector  = [ collector..., ]
          send stamp collector.shift() while collector.length > 0
          htmlish     = HTMLISH.parse $source
          # H.tabulate '^78^', htmlish
          # debug '^78^', rpr $source
          # info '^78^', x for x in htmlish
          unless htmlish.length is 1
            ### TAINT use API to create token ###
            # throw new Error "^34345^ expected single token, got #{rpr htmlish}"
            return send { mode: 'tag', tid: '$error', }
          [ htmlish ]           = GUY.lft.thaw htmlish
          htmlish[htmlish_sym]  = true
          htmlish.$collector    = $collector
          htmlish.$source       = $source
          send htmlish
        return null
      #.....................................................................................................
      else
        return send d unless nxt?.mk.startsWith 'tag:'
        within_tag = true
        collector.push d
      #.....................................................................................................
      return null
    sp.push $_hd_token_from_paragate_token()
    return sp
  #.........................................................................................................
  p             = new Pipeline()
  p.lexer       = lexer
  p.push $tokenize p
  p.push $parse_htmlish_tag()
  # p.push show = ( d ) -> urge '^parser@1^', d
  # debug '^43^', p
  return p
