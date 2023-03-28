(function() {
  'use strict';
  var $, DATOM, E, GUY, H, Hypedown_lexer, Pipeline, Transformer, alert, debug, echo, get_base_types, help, info, inspect, lets, log, misfit, new_datom, plain, praise, rpr, stamp, transforms, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN-PARSER/XXX-TEMP-HTML'));

  //...........................................................................................................
  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  //...........................................................................................................
  ({Pipeline, Transformer, $, transforms} = require('moonriver'));

  //...........................................................................................................
  ({misfit, get_base_types} = require('./types'));

  E = require('./errors');

  H = require('./helpers');

  ({Hypedown_lexer} = require('./_hypedown-lexer'));

  //===========================================================================================================
  this.$001_prelude = class $001_prelude extends Transformer {};

  //===========================================================================================================
  this.$002_tokenize_lines = class $002_tokenize_lines extends Transformer {
    //---------------------------------------------------------------------------------------------------------
    $tokenize_line() {
      var lexer, types;
      types = get_base_types();
      lexer = new Hypedown_lexer();
      // debug '^3523^', @constructor.name
      return function(line, send) {
        var ref1, token;
        // debug '^3523^', @constructor.name
        types.validate.text(line);
        ref1 = lexer.walk(line);
        for (token of ref1) {
          send(token);
        }
        return null;
      };
    }

  };

  //===========================================================================================================
  this.$010_prepare_paragraphs = class $010_prepare_paragraphs extends Transformer {
    //---------------------------------------------------------------------------------------------------------
    $consolidate_newlines() {
      var consolidate_newlines, count, flush, position, stop, template;
      count = 0;
      position = null;
      stop = Symbol('stop');
      template = {
        mode: 'plain',
        tid: 'nls',
        mk: 'plain:nls',
        $: 'consolidate_newlines'
      };
      //.......................................................................................................
      flush = (send) => {
        var data, nls, value;
        if (count === 0) {
          return null;
        }
        value = '\n'.repeat(count);
        position.lnr2 = position.lnr1 + count;
        if (count > 1) {
          position.lnr2 = position.lnr1 + count - 1;
          position.x2 = 0;
        }
        data = {count};
        nls = {...template, value, data, ...position};
        count = 0;
        position = null;
        return send(nls);
      };
      //.......................................................................................................
      return $({stop}, consolidate_newlines = (d, send) => {
        if (d === stop) {
          return flush(send);
        }
        if (d.$stamped) {
          return send(d);
        }
        if (d.mk === 'plain:nl') {
          count++;
          throw new Error("XXX make get_position() static method of Interlex");
          if (position == null) {
            position = H.get_position(d);
          }
        } else {
          flush(send);
          send(d);
        }
        return null;
      });
    }

    //---------------------------------------------------------------------------------------------------------
    $inject_starter() {
      var is_first, mk, mode, tid;
      is_first = true;
      mode = 'prep';
      tid = 'starter';
      mk = `${mode}:${tid}`;
      return function(d, send) {
        if (!is_first) {
          return send(d);
        }
        if (/^\s*$/.test(d.value)) {
          return send(d);
        }
        is_first = false;
        send({
          ...d,
          mode,
          tid,
          mk,
          jump: null,
          value: '',
          $: 'inject_starter'
        });
        return send(d);
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $add_parbreak_markers() {
      var add_parbreak_markers, get_start_token, get_stop_token, has_pars, newlines_mk, par_start_mk, par_stop_mk, started, stop, tid_start, tid_stop;
      newlines_mk = 'plain:nls';
      tid_start = 'par:start';
      tid_stop = 'par:stop';
      par_start_mk = 'html:par:start';
      par_stop_mk = 'html:par:stop';
      stop = Symbol('stop');
      has_pars = false;
      started = false;
      //.......................................................................................................
      get_start_token = function(ref) {
        return {
          mode: 'html',
          tid: tid_start,
          mk: par_start_mk,
          value: '',
          ...(H.get_position(ref)),
          $: 'add_parbreak_markers'
        };
      };
      //.......................................................................................................
      get_stop_token = function(ref) {
        return {
          mode: 'html',
          tid: tid_stop,
          mk: par_stop_mk,
          value: '',
          ...(H.get_position(ref)),
          $: 'add_parbreak_markers'
        };
      };
      //-------------------------------------------------------------------------------------------------------
      return add_parbreak_markers = class add_parbreak_markers extends Transformer {
        $add_stop() {
          return $({stop}, function(d, send) {
            return send(d);
          });
        }

        $window() {
          return transforms.$window({
            min: 0,
            max: +1,
            empty: null
          });
        }

        $add_parbreak_markers() {
          return function([d, nxt], send) {
            if (d === stop) {
              return null;
            }
            if (d.mk === 'prep:starter') {
              send(stamp(d));
              started = true;
            }
            if (!started) {
              return send(d);
            }
            if (nxt === stop) {
              if (has_pars) {
                send(get_stop_token(d));
              }
              return send(d);
            }
            if (!((d.mk === 'prep:starter') || (H.select_token(d, newlines_mk)) && (d.data.count > 1))) {
              return send(d);
            }
            if (has_pars) {
              send(get_stop_token(d));
            }
            if (d.mk !== 'prep:starter') {
              send(d);
            }
            send(get_start_token(d));
            has_pars = true;
            return null;
          };
        }

      };
    }

  };

  // $show_1: -> show_1 = ( d ) -> info d

  //===========================================================================================================
  this.$020_priority_markup = class $020_priority_markup extends Transformer {
    /* 'Priority markup': markup that blocks parsing of its contents, like codespans, in which stuff like
     stars and double stars do not lead to `<em>`, `<strong>` tags */
    //---------------------------------------------------------------------------------------------------------
    $parse_md_codespan() {
      /* TAINT consider to rewrite using `$window()` transform */
      /* TAINT use CFG pattern */
      /* TAINT use API for `mode:key` IDs */
      var $flush, _flush, collector, enter_mk, escchr_mk, exit_mk, flush, nl_mk, parse_md_codespan, stop, text_mk;
      enter_mk = 'cspan:start';
      text_mk = 'cspan:text';
      nl_mk = 'cspan:nl';
      escchr_mk = 'cspan:escchr';
      exit_mk = 'cspan:stop';
      collector = [];
      stop = Symbol('stop');
      //.......................................................................................................
      $flush = function() {
        var Flush;
        Flush = class Flush extends Transformer {
          $source() {
            return collector;
          }

          $show_1() {
            return function(d) {
              return urge('^flush.show_1^', collector.length, d);
            };
          }

          $on_stop() {
            return $({stop}, function(d) {
              if (d === stop) {
                return collector.length = 0;
              }
            });
          }

        };
        return Flush.as_pipeline();
      };
      _flush = $flush();
      flush = function*() {
        return (yield* _flush.walk_and_stop());
      };
      // #.......................................................................................................
      // flush = ->
      //   last_idx      = collector.length - 1
      //   first_txt_idx = 1
      //   last_txt_idx  = last_idx - 1
      //   lnr1          = ( collector.at  0 ).lnr1
      //   lnr2          = ( collector.at -1 ).lnr2
      //   x1            = ( collector.at  0 ).x1
      //   x2            = ( collector.at -1 ).x2
      //   texts         = []
      //   #.....................................................................................................
      //   for d, idx in collector
      //     urge '^flush^', d.mk, ( rpr d.value ), ( idx is 0 ), ( idx is last_idx )
      //     if ( idx is 0 )
      //       yield stamp d
      //       yield H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '<code>'
      //       continue
      //     #...................................................................................................
      //     switch d.mk
      //       when text_mk
      //         if      idx is first_txt_idx  then  texts.push d.value.trimStart()
      //         else if idx is last_txt_idx   then  texts.push d.value.trimEnd()
      //         else                                texts.push d.value
      //       when escchr_mk
      //         ### TAINT must properly resolve escaped character ###
      //         texts.push d.data.chr
      //       else
      //         throw new Error "^^parse_md_codespan@32", "internal error: unhandled token #{rpr d}"
      //     #...................................................................................................
      //     if ( idx is last_txt_idx )
      //       value = texts.join ''
      //       ### TAINT should not use `html` or must escape first ###
      //       yield { mode: 'html', tid: 'text', mk: 'html:text', value, lnr1, x1, lnr2, x2, }
      //   ### TAINT must account for case when parsing ends before closing markup ###
      //   yield H.XXX_new_token 'parse_md_codespan', d, 'html', 'tag', 'code', '</code>'
      //   #.....................................................................................................
      //   collector.length = 0
      //   return null
      //.......................................................................................................
      return parse_md_codespan = $({stop}, function(d, send) {
        var e, ref1, ref2;
        if (d === stop) {
          ref1 = flush();
          for (e of ref1) {
            send(e);
          }
          return null;
        }
        //.....................................................................................................
        switch (d.mk) {
          case enter_mk:
          case text_mk:
          case nl_mk:
          case escchr_mk:
            send(stamp(d));
            collector.push(d);
            break;
          case exit_mk:
            collector.push(d);
            ref2 = flush();
            for (e of ref2) {
              send(e);
            }
            break;
          default:
            send(d);
        }
        //.....................................................................................................
        return null;
      });
    }

  };

  //===========================================================================================================
  this.$030_htmlish_tags = (function() {
    class $030_htmlish_tags extends Transformer {};

    $030_htmlish_tags.prototype.$ = (require('./_hypedown-parser-htmlish')).Hypedown_parser_htmlish;

    return $030_htmlish_tags;

  }).call(this);

  //===========================================================================================================
  this.$040_stars = (function() {
    class $040_stars extends Transformer {};

    $040_stars.prototype.$ = (require('./_hypedown-parser-stars')).Hypedown_parser_md_stars;

    return $040_stars;

  }).call(this);

  //===========================================================================================================
  this.$050_hash_headings = class $050_hash_headings extends Transformer {
    $() {
      var add_headings_markup, get_start_token, get_stop_token, hashes_mk, level, par_start_mk, par_stop_mk, position, prv_was_empty, within_h;
      hashes_mk = "plain:hashes";
      par_start_mk = 'html:par:start';
      par_stop_mk = 'html:par:stop';
      prv_was_empty = false;
      within_h = false;
      level = null;
      position = null;
      //.......................................................................................................
      get_start_token = function({ref, name, level}) {
        return {
          mode: 'html',
          tid: 'p:start',
          mk: 'html:h:start',
          data: {name, level},
          value: `<${name}>`,
          ...(H.get_position(ref)),
          $: '050_hash_headings'
        };
      };
      //.......................................................................................................
      get_stop_token = function({ref, name, level}) {
        var position_2;
        position_2 = H.get_position(ref);
        position.lnr2 = position_2.lnr2;
        position.x2 = position_2.x2;
        return {
          mode: 'html',
          tid: 'p:stop',
          mk: 'html:h:stop',
          data: {name, level},
          value: `</${name}>`,
          ...position,
          $: '050_hash_headings'
        };
      };
      //-------------------------------------------------------------------------------------------------------
      return add_headings_markup = class add_headings_markup extends Transformer {
        $window() {
          return transforms.$window({
            min: -1,
            max: +1,
            empty: null
          });
        }

        $add_headings() {
          return function([prv, d, nxt], send) {
            var name;
            if (((prv != null ? prv.mk : void 0) === par_start_mk) && (d.mk === hashes_mk)) {
              send(stamp(d));
              position = H.get_position(d);
              within_h = true;
              level = d.data.text.length;
              name = `h${level}`;
              send(get_start_token({
                ref: d,
                name,
                level
              }));
            } else if (within_h && ((nxt != null ? nxt.mk : void 0) === par_stop_mk)) {
              send(d);
              name = `h${level}`;
              send(get_stop_token({
                ref: d,
                name,
                level
              }));
              level = null;
              within_h = false;
              position = null;
            } else {
              send(d);
            }
            return null;
          };
        }

      };
    }

  };

}).call(this);

//# sourceMappingURL=_hypedown-parser-xxx-temp.js.map