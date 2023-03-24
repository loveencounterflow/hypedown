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
  this.$001_Prelude = class $001_Prelude extends Transformer {};

  //===========================================================================================================
  this.$002_tokenize_lines = class $002_tokenize_lines extends Transformer {
    //---------------------------------------------------------------------------------------------------------
    $tokenize_line() {
      var lexer, types;
      types = get_base_types();
      lexer = new Hypedown_lexer();
      debug('^3523^', this.constructor.name);
      return function(line, send) {
        var ref, token;
        debug('^3523^', this.constructor.name);
        types.validate.text(line);
        ref = lexer.walk(line);
        for (token of ref) {
          send(token);
        }
        return null;
      };
    }

  };

  //===========================================================================================================
  this.$010_prepare_paragraphs = class $010_prepare_paragraphs extends Transformer {
    //---------------------------------------------------------------------------------------------------------
    $inject_virtual_nl() {
      /* normalize start of document by injecting two newlines. */
      var is_first, mk, mode, tid;
      is_first = true;
      mode = 'plain';
      tid = 'nl';
      mk = `${mode}:${tid}`;
      return function(d, send) {
        if (!is_first) {
          return send(d);
        }
        is_first = false;
        send({
          mode,
          tid,
          mk,
          jump: null,
          value: '',
          lnr1: 1,
          x1: 0,
          lnr2: 1,
          x2: 0,
          data: {
            virtual: true
          },
          $key: '^plain',
          $: 'inject_virtual_nl'
        });
        send({
          mode,
          tid,
          mk,
          jump: null,
          value: '',
          lnr1: 1,
          x1: 0,
          lnr2: 1,
          x2: 0,
          data: {
            virtual: true
          },
          $key: '^plain',
          $: 'inject_virtual_nl'
        });
        return send(d);
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $add_parbreak_markers()/* needs inject_virtual_nl */ {
      var add_parbreak_markers, mk, newline_mk, p, template, window;
      newline_mk = 'plain:nl';
      mk = 'html:parbreak';
      p = new Pipeline();
      template = {
        mode: 'html',
        tid: 'parbreak',
        mk,
        value: '',
        $key: '^html',
        $: 'add_parbreak_markers'
      };
      p.push(window = transforms.$window({
        min: -2,
        max: 0,
        empty: null
      }));
      p.push(add_parbreak_markers = function([lookbehind, previous, current], send) {
        if (!(H.select_token(lookbehind, newline_mk))) {
          return send(current);
        }
        if (!(H.select_token(previous, newline_mk))) {
          return send(current);
        }
        if (H.select_token(current, newline_mk)) {
          return send(current);
        }
        send({...template, ...(GUY.props.pick_with_fallback(current, null, 'lnr1', 'x1', 'lnr2', 'x2'))});
        return send(current);
      });
      return p;
    }

  };

  //===========================================================================================================
  this.$020_priority_markup = class $020_priority_markup extends Transformer {
    /* 'Priority markup': markup that blocks parsing of its contents, like codespans, in which stuff like
     stars and double stars do not lead to `<em>`, `<strong>` tags */
    //---------------------------------------------------------------------------------------------------------
    $parse_md_codespan() {
      /* TAINT consider to rewrite using `$window()` transform */
      /* TAINT use CFG pattern */
      /* TAINT use API for `mode:key` IDs */
      var collector, enter_mk, escchr_mk, exit_mk, flush, parse_md_codespan, text_mk;
      enter_mk = "plain:codespan";
      exit_mk = "cspan:codespan";
      text_mk = "cspan:text";
      escchr_mk = "cspan:escchr";
      collector = [];
      //.......................................................................................................
      flush = function*() {
        var d, first_txt_idx, i, idx, last_idx, last_txt_idx, len, lnr1, lnr2, texts, value, x1, x2;
        last_idx = collector.length - 1;
        first_txt_idx = 1;
        last_txt_idx = last_idx - 1;
        lnr1 = (collector.at(0)).lnr1;
        lnr2 = (collector.at(-1)).lnr2;
        x1 = (collector.at(0)).x1;
        x2 = (collector.at(-1)).x2;
        texts = [];
//.....................................................................................................
        for (idx = i = 0, len = collector.length; i < len; idx = ++i) {
          d = collector[idx];
          if (idx === 0) {
            yield stamp(d);
            yield H.XXX_new_token('parse_md_codespan', d, 'html', 'tag', 'code', '<code>');
            continue;
          } else if (idx === last_idx) {
            yield stamp(d);
            yield H.XXX_new_token('parse_md_codespan', d, 'html', 'tag', 'code', '</code>');
            continue;
          }
          //...................................................................................................
          switch (d.mk) {
            case text_mk:
              if (idx === first_txt_idx) {
                texts.push(d.value.trimStart());
              } else if (idx === last_txt_idx) {
                texts.push(d.value.trimEnd());
              } else {
                texts.push(d.value);
              }
              break;
            case escchr_mk:
              /* TAINT must properly resolve escaped character */
              texts.push(d.data.chr);
              break;
            default:
              throw new Error("^^parse_md_codespan@32", `internal error: unhandled token ${rpr(d)}`);
          }
          //...................................................................................................
          if (idx === last_txt_idx) {
            value = texts.join('');
            yield ({
              /* TAINT should not use `html` or must escape first */
              mode: 'html',
              tid: 'text',
              mk: 'html:text',
              value,
              lnr1,
              x1,
              lnr2,
              x2
            });
          }
        }
        //.....................................................................................................
        collector.length = 0;
        return null;
      };
      //.......................................................................................................
      return parse_md_codespan = function(d, send) {
        var e, ref;
        switch (d.mk) {
          case enter_mk:
          case text_mk:
          case escchr_mk:
            send(stamp(d));
            collector.push(d);
            break;
          case exit_mk:
            collector.push(d);
            ref = flush();
            for (e of ref) {
              send(e);
            }
            break;
          default:
            send(d);
        }
        return null;
      };
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
      var add_headings, hashes_mk, mode, p, parbreak_mk, prv_was_empty, tid, window;
      mode = 'plain';
      tid = 'hashes';
      hashes_mk = `${mode}:${tid}`;
      parbreak_mk = 'html:parbreak';
      prv_was_empty = false;
      p = new Pipeline();
      p.push(window = transforms.$window({
        min: -1,
        max: 0,
        empty: null
      }));
      p.push(add_headings = function([previous, d], send) {
        var name;
        if (!(((previous != null ? previous.mk : void 0) === parbreak_mk) && (d.mk === hashes_mk))) {
          return send(d);
        }
        send(stamp(d));
        name = `h${d.data.text.length}`;
        send(H.XXX_new_token('050_hash_headings', d, 'html', 'tag', name, `<${name}>`));
        return null;
      });
      return p;
    }

  };

}).call(this);

//# sourceMappingURL=_hypedown-parser-xxx-temp.js.map