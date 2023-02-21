
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
  whisper }               = GUY.trm.get_loggers 'HYPEDOWN-PARSER/TRANSFORM-STARS'
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
{ sorter }                = require 'intertext-lexer'

#===========================================================================================================
class @Hypedown_transforms_stars

  #---------------------------------------------------------------------------------------------------------
  $parse_md_stars: ->
    star1_mk        = 'plain:star1'
    star2_mk        = 'plain:star2'
    star3_mk        = 'plain:star3'
    #.......................................................................................................
    within =
      star1:    false
      star2:    false
    token_for =
      star1:    null
      star2:    null
    #.......................................................................................................
    enter = ( region, token ) ->
      within[     region ] = true
      token_for[  region ] = token
      return null
    enter.star1 = ( token ) -> enter 'star1', token
    enter.star2 = ( token ) -> enter 'star2', token
    #.......................................................................................................
    exit = ( region ) ->
      within[   region ] = false
      token_for[ region ] = null
      return null
    exit.star1 = -> exit 'star1'
    exit.star2 = -> exit 'star2'
    #.......................................................................................................
    return ( d, send ) ->
      switch d.mk
        #...................................................................................................
        when star1_mk
          send stamp d
          if within.star1 then  exit.star1();         send H.XXX_new_token 'parse_md_stars@1^', d, 'html', 'tag', 'i', '</i>'
          else                  enter.star1 d;        send H.XXX_new_token 'parse_md_stars@2^', d, 'html', 'tag', 'i', '<i>'
        #...................................................................................................
        when star2_mk
          send stamp d
          if within.star2
            if within.star1
              if sorter.ordering_is token_for.star2, token_for.star1
                exit.star1();         send H.XXX_new_token 'parse_md_stars@3^', d, 'html', 'tag', 'i', '</i>'
                exit.star2();         send H.XXX_new_token 'parse_md_stars@4^', d, 'html', 'tag', 'b', '</b>'
                enter.star1 d;        send H.XXX_new_token 'parse_md_stars@5^', d, 'html', 'tag', 'i', '<i>'
              else
                exit.star2();         send H.XXX_new_token 'parse_md_stars@6^', d, 'html', 'tag', 'b', '</b>'
            else
              exit.star2();         send H.XXX_new_token 'parse_md_stars@7^', d, 'html', 'tag', 'b', '</b>'
          else
            enter.star2 d;        send H.XXX_new_token 'parse_md_stars@8^', d, 'html', 'tag', 'b', '<b>'
        #...................................................................................................
        when star3_mk
          send stamp d
          if within.star1
            if within.star2
              if sorter.ordering_is token_for.star2, token_for.star1
                exit.star1();       send H.XXX_new_token 'parse_md_stars@9^', d, 'html', 'tag', 'i', '</i>'
                exit.star2();       send H.XXX_new_token 'parse_md_stars@10^', d, 'html', 'tag', 'b', '</b>'
              else
                exit.star2();       send H.XXX_new_token 'parse_md_stars@11^', d, 'html', 'tag', 'b', '</b>'
                exit.star1();       send H.XXX_new_token 'parse_md_stars@12^', d, 'html', 'tag', 'i', '</i>'
            else
              exit.star1();         send H.XXX_new_token 'parse_md_stars@13^', d, 'html', 'tag', 'i', '</i>'
              enter.star2 d;        send H.XXX_new_token 'parse_md_stars@14^', d, 'html', 'tag', 'b', '<b>'
          else
            if within.star2
              exit.star2();         send H.XXX_new_token 'parse_md_stars@15^', d, 'html', 'tag', 'b', '</b>'
              enter.star1 d;        send H.XXX_new_token 'parse_md_stars@16^', d, 'html', 'tag', 'i', '<i>'
            else
              enter.star2 d;        send H.XXX_new_token 'parse_md_stars@17^', d, 'html', 'tag', 'b', '<b>'
              position = { lnr1: d.lnr1, x1: d.x1 + 2, lnr2: d.lnr2, x2: d.x2, }
              enter.star1 position; send H.XXX_new_token 'parse_md_stars@18^', \
                position, 'html', 'tag', 'i', '<i>'
        #...................................................................................................
        else send d
      return null
