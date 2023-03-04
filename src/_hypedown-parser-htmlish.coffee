

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
  _hd_token_from_paragate_token: ( hd_token, pg_token ) ->
    tag_types =
      otag:       { open: true,  close: false, }  # opening tag, `<a>`
      ctag:       { open: false, close: true,  }  # closing tag, `</a>` or `</>`
      ntag:       { open: true,  close: false, }  # opening tag of `<i/italic/`
      nctag:      { open: false, close: true,  }  # closing slash of `<i/italic/`
      stag:       { open: true,  close: true,  }  # self-closing tag, `<br/>`
    #.......................................................................................................
    R =
      mode:   'tag'
      tid:    pg_token.type
      mk:     "tag:???"
      jump:   null
      value:  hd_token.value
      ### TAINT must give first_lnr, last_lnr ###
      lnr1:   hd_token.lnr1
      x1:     hd_token.x1
      lnr2:   hd_token.lnr2
      x2:     hd_token.x2
      x:
        atrs:   pg_token.atrs
        id:     pg_token.id
    return R

  #---------------------------------------------------------------------------------------------------------
  $parse_htmlish: ->
    p = new Pipeline()
    p.push @$_collect_tag_tokens()
    p.push @$_parse_tag_source()
    return p

  #---------------------------------------------------------------------------------------------------------
  $_collect_tag_tokens: =>
    position  = null
    collector = null
    return _collect_tag_tokens = ( d, send ) =>
      if d.tid is '$border'
        if d.x.nxt is 'tag'
          send d
          collector = []
          position  = GUY.props.pick_with_fallback d, null, 'lnr1', 'x1'
        else if d.x.prv is 'tag'
          position  = { position..., ( GUY.props.pick_with_fallback d, null, 'lnr2', 'x2' )..., }
          debug '^345^', position, ( t.value for t in collector ).join '|'
          ### TAINT use API ###
          token =
            mode:       'raw-html'
            tid:        'tag'
            mk:         'raw-html:tag'
            jump:       null
            value:      ( t.value for t in collector ).join ''
            # x:          null
            # $stamped:   null
            # name:       null
            lnr1:       position.lnr1
            x1:         position.x1
            lnr2:       position.lnr2
            x2:         position.x2
            $key:       '^whatever'
            $:          '^parse_htmlish@1^'
          #.................................................................................................
          send ( stamp t ) for t in collector
          collector = null
          send token
          send d
      else if d.mode is 'tag'
        collector.push d
      else
        send d
      # urge '^parse_htmlish@1^', d
    return null

  #---------------------------------------------------------------------------------------------------------
  $_parse_tag_source: =>
    return _parse_tag_source = ( d, send ) =>
      return send d unless d.mk is 'raw-html:tag'
      send stamp d
      unless ( pg_tokens = HTMLISH.parse d.value ).length is 1
        ### TAINT use API to create token ###
        return send { mode: 'tag', tid: '$error', } ### expected single token, got #{rpr htmlish} ###
      [ pg_token ]           = GUY.lft.thaw pg_tokens
      send @_hd_token_from_paragate_token d, pg_token
      return null


#-----------------------------------------------------------------------------------------------------------
new_parser = ( lexer ) ->

  #.........................................................................................................
  $_hd_token_from_paragate_token = ->
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