
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


#===========================================================================================================
class @Hypedown_transforms_stars

  #---------------------------------------------------------------------------------------------------------
  $parse_md_stars: ->
    star1_mk  = 'plain:star1'
    star2_mk  = 'plain:star2'
    star3_mk  = 'plain:star3'
    #.......................................................................................................
    within =
      one:    false
      two:    false
    start_of =
      one:    null
      two:    null
    #.......................................................................................................
    enter = ( mode, start ) ->
      within[   mode ] = true
      start_of[ mode ] = start
      return null
    enter.one = ( start ) -> enter 'one', start
    enter.two = ( start ) -> enter 'two', start
    #.......................................................................................................
    exit = ( mode ) ->
      within[   mode ] = false
      start_of[ mode ] = null
      return null
    exit.one = -> exit 'one'
    exit.two = -> exit 'two'
    #.......................................................................................................
    return ( d, send ) ->
      switch d.mk
        #...................................................................................................
        when star1_mk
          send stamp d
          if within.one then  exit.one();         send H.XXX_new_token 'parse_md_stars@1^', d, 'html', 'tag', 'i', '</i>'
          else                enter.one d.start;  send H.XXX_new_token 'parse_md_stars@2^', d, 'html', 'tag', 'i', '<i>'
        #...................................................................................................
        when star2_mk
          send stamp d
          if within.two
            if within.one
              if start_of.one > start_of.two
                exit.one();         send H.XXX_new_token 'parse_md_stars@3^', d, 'html', 'tag', 'i', '</i>'
                exit.two();         send H.XXX_new_token 'parse_md_stars@4^', d, 'html', 'tag', 'b', '</b>'
                enter.one d.start;  send H.XXX_new_token 'parse_md_stars@5^', d, 'html', 'tag', 'i', '<i>'
              else
                exit.two();         send H.XXX_new_token 'parse_md_stars@6^', d, 'html', 'tag', 'b', '</b>'
            else
              exit.two();         send H.XXX_new_token 'parse_md_stars@7^', d, 'html', 'tag', 'b', '</b>'
          else
            enter.two d.start;  send H.XXX_new_token 'parse_md_stars@8^', d, 'html', 'tag', 'b', '<b>'
        #...................................................................................................
        when star3_mk
          send stamp d
          if within.one
            if within.two
              if start_of.one > start_of.two
                exit.one();       send H.XXX_new_token 'parse_md_stars@9^', d, 'html', 'tag', 'i', '</i>'
                exit.two();       send H.XXX_new_token 'parse_md_stars@10^', d, 'html', 'tag', 'b', '</b>'
              else
                exit.two();       send H.XXX_new_token 'parse_md_stars@11^', d, 'html', 'tag', 'b', '</b>'
                exit.one();       send H.XXX_new_token 'parse_md_stars@12^', d, 'html', 'tag', 'i', '</i>'
            else
              exit.one();         send H.XXX_new_token 'parse_md_stars@13^', d, 'html', 'tag', 'i', '</i>'
              enter.two d.start;  send H.XXX_new_token 'parse_md_stars@14^', d, 'html', 'tag', 'b', '<b>'
          else
            if within.two
              exit.two();         send H.XXX_new_token 'parse_md_stars@15^', d, 'html', 'tag', 'b', '</b>'
              enter.one d.start;  send H.XXX_new_token 'parse_md_stars@16^', d, 'html', 'tag', 'i', '<i>'
            else
              enter.two d.start;  send H.XXX_new_token 'parse_md_stars@17^', d, 'html', 'tag', 'b', '<b>'
              enter.one d.start + 2;  send H.XXX_new_token 'parse_md_stars@18^', { start: d.start + 2, stop: d.stop, }, 'html', 'tag', 'i', '<i>'
        #...................................................................................................
        else send d
      return null
