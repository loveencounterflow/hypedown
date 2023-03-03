(function() {
  'use strict';
  var $, DATOM, E, GUY, H, Pipeline, alert, debug, echo, get_base_types, help, info, inspect, lets, log, misfit, new_datom, plain, praise, rpr, sorter, stamp, transforms, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN-PARSER/TRANSFORM-STARS'));

  //...........................................................................................................
  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  //...........................................................................................................
  ({Pipeline, $, transforms} = require('moonriver'));

  //...........................................................................................................
  ({misfit, get_base_types} = require('./types'));

  E = require('./errors');

  H = require('./helpers');

  ({sorter} = require('intertext-lexer'));

  //===========================================================================================================
  this.Hypedown_lexer_stars = class Hypedown_lexer_stars {
    //---------------------------------------------------------------------------------------------------------
    $parse_md_stars() {
      var enter, exit, star1_mk, star2_mk, star3_mk, token_for, within;
      star1_mk = 'plain:star1';
      star2_mk = 'plain:star2';
      star3_mk = 'plain:star3';
      //.......................................................................................................
      within = {
        star1: false,
        star2: false
      };
      token_for = {
        star1: null,
        star2: null
      };
      //.......................................................................................................
      enter = function(region, token) {
        within[region] = true;
        token_for[region] = token;
        return null;
      };
      enter.star1 = function(token) {
        return enter('star1', token);
      };
      enter.star2 = function(token) {
        return enter('star2', token);
      };
      //.......................................................................................................
      exit = function(region) {
        within[region] = false;
        token_for[region] = null;
        return null;
      };
      exit.star1 = function() {
        return exit('star1');
      };
      exit.star2 = function() {
        return exit('star2');
      };
      //.......................................................................................................
      return function(d, send) {
        var position;
        switch (d.mk) {
          //...................................................................................................
          case star1_mk:
            send(stamp(d));
            if (within.star1) {
              exit.star1();
              send(H.XXX_new_token('parse_md_stars@1^', d, 'html', 'tag', 'i', '</i>'));
            } else {
              enter.star1(d);
              send(H.XXX_new_token('parse_md_stars@2^', d, 'html', 'tag', 'i', '<i>'));
            }
            break;
          //...................................................................................................
          case star2_mk:
            send(stamp(d));
            if (within.star2) {
              if (within.star1) {
                if (sorter.ordering_is(token_for.star2, token_for.star1)) {
                  exit.star1();
                  send(H.XXX_new_token('parse_md_stars@3^', d, 'html', 'tag', 'i', '</i>'));
                  exit.star2();
                  send(H.XXX_new_token('parse_md_stars@4^', d, 'html', 'tag', 'b', '</b>'));
                  enter.star1(d);
                  send(H.XXX_new_token('parse_md_stars@5^', d, 'html', 'tag', 'i', '<i>'));
                } else {
                  exit.star2();
                  send(H.XXX_new_token('parse_md_stars@6^', d, 'html', 'tag', 'b', '</b>'));
                }
              } else {
                exit.star2();
                send(H.XXX_new_token('parse_md_stars@7^', d, 'html', 'tag', 'b', '</b>'));
              }
            } else {
              enter.star2(d);
              send(H.XXX_new_token('parse_md_stars@8^', d, 'html', 'tag', 'b', '<b>'));
            }
            break;
          //...................................................................................................
          case star3_mk:
            send(stamp(d));
            if (within.star1) {
              if (within.star2) {
                if (sorter.ordering_is(token_for.star2, token_for.star1)) {
                  exit.star1();
                  send(H.XXX_new_token('parse_md_stars@9^', d, 'html', 'tag', 'i', '</i>'));
                  exit.star2();
                  send(H.XXX_new_token('parse_md_stars@10^', d, 'html', 'tag', 'b', '</b>'));
                } else {
                  exit.star2();
                  send(H.XXX_new_token('parse_md_stars@11^', d, 'html', 'tag', 'b', '</b>'));
                  exit.star1();
                  send(H.XXX_new_token('parse_md_stars@12^', d, 'html', 'tag', 'i', '</i>'));
                }
              } else {
                exit.star1();
                send(H.XXX_new_token('parse_md_stars@13^', d, 'html', 'tag', 'i', '</i>'));
                enter.star2(d);
                send(H.XXX_new_token('parse_md_stars@14^', d, 'html', 'tag', 'b', '<b>'));
              }
            } else {
              if (within.star2) {
                exit.star2();
                send(H.XXX_new_token('parse_md_stars@15^', d, 'html', 'tag', 'b', '</b>'));
                enter.star1(d);
                send(H.XXX_new_token('parse_md_stars@16^', d, 'html', 'tag', 'i', '<i>'));
              } else {
                enter.star2(d);
                send(H.XXX_new_token('parse_md_stars@17^', d, 'html', 'tag', 'b', '<b>'));
                position = {
                  lnr1: d.lnr1,
                  x1: d.x1 + 2,
                  lnr2: d.lnr2,
                  x2: d.x2
                };
                enter.star1(position);
                send(H.XXX_new_token('parse_md_stars@18^', position, 'html', 'tag', 'i', '<i>'));
              }
            }
            break;
          default:
            //...................................................................................................
            send(d);
        }
        return null;
      };
    }

  };

}).call(this);

//# sourceMappingURL=_hypedown-lexer-stars.js.map