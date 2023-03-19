

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
{ DATOM }                 = require 'datom'
#...........................................................................................................
{ new_datom
  lets
  stamp }                 = DATOM
TR                        = require './tag-registry'
#...........................................................................................................
HTMLISH                   = ( require 'paragate/lib/htmlish.grammar' ).new_grammar { bare: true, }
{ Pipeline
  Pipeline_module
  $
  transforms }            = require 'moonriver'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class @Hypedown_parser_htmlish extends Pipeline_module

  #---------------------------------------------------------------------------------------------------------
  _hd_token_from_paragate_token: ( hd_token, pg_token ) ->
    #.......................................................................................................
    if pg_token.$key is '^pi'
      tid = 'xmlpi'
    else if pg_token.$key is '^error'
      tid = '$error'
    else
      unless ( tid = TR.pg_and_hd_tags[ pg_token.type ]?.type )?
        debug '^35345^', hd_token
        debug '^35345^', pg_token
        return GUY.lft.lets hd_token, ( d ) =>
          message = "unable to find pg_token.type #{rpr pg_token.type} in TR.pg_and_hd_tags"
          d.mode  = 'tag'
          d.tid   = '$error'
          d.data  = { d.data..., message, hd_token, }
          d.$     = '^_hd_token_from_paragate_token@1^'
    #.......................................................................................................
    R =
      mode:   'tag'
      tid:    tid
      jump:   null
      value:  hd_token.value
      ### TAINT must give first_lnr, last_lnr ###
      data:   { TR.pg_and_hd_tags[ pg_token.type ]..., }
      lnr1:   hd_token.lnr1
      x1:     hd_token.x1
      lnr2:   hd_token.lnr2
      x2:     hd_token.x2
    R.mk        = "#{R.mode}:#{R.tid}"
    R.data.atrs = pg_token.atrs if pg_token.atrs?
    R.data.id   = pg_token.id   if pg_token.id?
    if pg_token.$key is '^error'
      R.data.code     = pg_token.code
      R.data.message  = pg_token.message
    return R

  # #---------------------------------------------------------------------------------------------------------
  # $parse_htmlish: ->
  #   p = new Pipeline()
  #   p.push @$normalize_tag_tokens()
  #   p.push @$collect_tag_tokens()
  #   p.push @$parse_tag_source()
  #   p.push @$parse_sole_slash()
  #   return p

  #---------------------------------------------------------------------------------------------------------
  $normalize_tag_tokens: =>
    return _normalize_tag_tokens = ( d, send ) =>
      return send d unless d.mode is 'tag'
      return send d unless ( data = TR.pg_and_hd_tags[ d.tid ] )?
      send GUY.lft.lets d, ( d ) -> d.data = { d.data..., data..., }

  #---------------------------------------------------------------------------------------------------------
  $collect_tag_tokens: =>
    position  = null
    collector = null
    return _collect_tag_tokens = ( d, send ) =>
      if d.tid is '$border'
        #...................................................................................................
        if d.data.nxt is 'tag'
          send d
          collector = []
          position  = GUY.props.pick_with_fallback d, null, 'lnr1', 'x1'
        #...................................................................................................
        else if d.data.prv is 'tag'
          if ( collector.length is 1 ) and not ( ( first_token = collector[ 0 ] )?.data?.parse ? true )
            collector = null
            return send first_token
          #.................................................................................................
          position  = { position..., ( GUY.props.pick_with_fallback d, null, 'lnr2', 'x2' )..., }
          # debug '^345^', position, ( t.value for t in collector ).join '|'
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
  $parse_tag_source: =>
    return _parse_tag_source = ( d, send ) =>
      return send d unless d.mk is 'raw-html:tag'
      # send stamp d ### NOTE intentionally hiding `raw-html` token as it is condiered an implementation detail ###
      pg_tokens = HTMLISH.parse d.value
      # unless pg_tokens.length is 1
      #   ### TAINT use API to create token ###
      #   return send { mode: 'tag', tid: '$error', \
      #     data: { message: "expected single token, got #{rpr pg_tokens}", }, $: '^_parse_tag_source@1^', }
      # [ pg_token ]           = GUY.lft.thaw pg_tokens
      send @_hd_token_from_paragate_token d, pg_token for pg_token in pg_tokens
      return null

  #---------------------------------------------------------------------------------------------------------
  $parse_sole_slash: =>
    tag_type_stack = []
    return _parse_sole_slash = ( d, send ) =>
      switch d.mk
        when 'tag:otag', 'tag:ctag', 'tag:ntag', 'tag:nctag', 'tag:stag'
          tag_type_stack.push d.type
          send d
        when 'plain:slash'
          # debug '^_parse_sole_slash@1^', tag_type_stack
          send stamp d
          null
        else
          send d
      return null

