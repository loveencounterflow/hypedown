(function() {
  'use strict';
  var $, DATOM, E, GUY, H, Hypedown_lexer, Hypedown_parser, Hypedown_parser_htmlish, Hypedown_parser_stars, Hypedown_transforms, Pipeline, alert, debug, echo, get_base_types, help, info, inspect, lets, log, misfit, new_datom, plain, praise, rpr, select_token, stamp, transforms, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN-PARSER'));

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

  ({Hypedown_parser_stars} = require('./_hypedown-parser-stars'));

  ({Hypedown_parser_htmlish} = require('./_hypedown-parser-htmlish'));

  ({Hypedown_lexer} = require('./_hypedown-lexer'));

  //-----------------------------------------------------------------------------------------------------------
  select_token = function(token, selector) {
    var ref;
    if (token == null) {
      return false;
    }
    if ((ref = token.$stamped) != null ? ref : false) {
      return false;
    }
    return token.mk === selector;
  };

  //===========================================================================================================
  Hypedown_transforms = class Hypedown_transforms extends Hypedown_parser_stars(Hypedown_parser_htmlish()) {
    //=========================================================================================================
    // PREPARATION
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
          start: 0,
          stop: 0,
          x: {
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
          start: 0,
          stop: 0,
          x: {
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
      var add_parbreak_markers, mk, mode, newline_lx, p, template, tid, window;
      mode = 'plain';
      newline_lx = `${mode}:nl`;
      tid = 'parbreak';
      mk = `html:${tid}`;
      p = new Pipeline();
      template = {
        mode: 'html',
        tid,
        mk,
        value: '',
        start: 0,
        stop: 0,
        $key: '^html',
        $: 'add_parbreak_markers'
      };
      p.push(window = transforms.$window({
        min: -2,
        max: 0,
        empty: null
      }));
      p.push(add_parbreak_markers = function([lookbehind, previous, current], send) {
        var start, stop;
        if (!(select_token(lookbehind, newline_lx))) {
          return send(current);
        }
        if (!(select_token(previous, newline_lx))) {
          return send(current);
        }
        if (select_token(current, newline_lx)) {
          return send(current);
        }
        ({start, stop} = current);
        send({...template, start, stop});
        return send(current);
      });
      return p;
    }

    //=========================================================================================================
    // PREPARATION
    //---------------------------------------------------------------------------------------------------------
    $parse_md_codespan({outer_mode, enter_tid, inner_mode, exit_tid}) {
      /* TAINT consider to rewrite using `$window()` transform */
      /* TAINT use CFG pattern */
      /* TAINT use API for `mode:key` IDs */
      var collector, enter_mk, escchr_mk, exit_mk, flush, text_mk;
      enter_mk = `${outer_mode}:${enter_tid}`;
      exit_mk = `${inner_mode}:${exit_tid}`;
      text_mk = `${inner_mode}:text`;
      escchr_mk = `${inner_mode}:escchr`;
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
              texts.push(d.x.chr);
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
      return function(d, send) {
        var ref;
        switch (d.mk) {
          case enter_mk:
          case text_mk:
          case escchr_mk:
            collector.push(d);
            break;
          case exit_mk:
            collector.push(d);
            ref = flush();
            for (d of ref) {
              send(d);
            }
            break;
          default:
            send(d);
        }
        // send H.XXX_new_token 'parse_md_codespan', d, 'html', 'text', null, d.value
        return null;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $parse_md_hashes({mode, tid}) {
      var hashes_mk, prv_was_empty;
      if (mode == null) {
        mode = 'plain';
      }
      if (tid == null) {
        tid = 'hashes';
      }
      hashes_mk = `${mode}:${tid}`;
      prv_was_empty = false;
      return function(d, send) {
        var name;
        if (d.mk !== hashes_mk) {
          return send(d);
        }
        send(stamp(d));
        name = `h${d.x.text.length}`;
        send(H.XXX_new_token('parse_md_hashes', d, 'html', 'tag', name, `<${name}>`));
        return null;
      };
    }

    //=========================================================================================================
    // FINALIZATION
    //---------------------------------------------------------------------------------------------------------
    $capture_text() {
      var catchall_lx;
      catchall_lx = "plain:other";
      return function(d, send) {
        if (!select_token(d, catchall_lx)) {
          return send(d);
        }
        send(stamp(d));
        return send(H.XXX_new_token('capture_text', d, 'html', 'text', d.value, d.value));
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $generate_missing_p_tags()/* needs add_parbreak_markers, capture_text */ {
      /* NOTE

      * https://stackoverflow.com/questions/8460993/p-end-tag-p-is-not-needed-in-html

      For the time being we opt for *not* using closing `</p>` tags, the reason for this being that they are
      not required by HTML5, and it *may* (just may) make things easier down the line when the closing tag is
      made implicit. However, observe that the very similar `<div>` tag still has to be closed explicitly.

       */
      var generate_missing_p_tags, html_text_lx, p, parbreak_lx, window;
      parbreak_lx = "html:parbreak";
      html_text_lx = "html:text";
      p = new Pipeline();
      p.push(window = transforms.$window({
        min: -1,
        max: +1,
        empty: null
      }));
      p.push(generate_missing_p_tags = function([prv, d, nxt], send) {
        if (!select_token(prv, parbreak_lx)) {
          /* TAINT not a correct solution, paragraph could begin with an inline element, so better check for
          nxt being namespace `html`, followed by any content category of `<p>` (i.e. Phrasing Content)

          see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p?retiredLocale=de,
          https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories#phrasing_content */
          return send(d);
        }
        // return send d unless select_token nxt,  html_text_lx
        send(H.XXX_new_token('generate_missing_p_tags', d, 'html', 'text', '<p>', '<p>'));
        return send(d);
      });
      return p;
    }

    //---------------------------------------------------------------------------------------------------------
    $generate_html_nls()/* needs generate_missing_p_tags */ {
      var generate_html_nls, newline_lx;
      newline_lx = "plain:nl";
      return generate_html_nls = function(d, send) {
        var ref, ref1;
        if (!select_token(d, newline_lx)) {
          return send(d);
        }
        send(stamp(d));
        if ((ref = (ref1 = d.x) != null ? ref1.virtual : void 0) != null ? ref : false) {
          return;
        }
        return send(H.XXX_new_token('generate_html_nls', d, 'html', 'text', '\n', '\n'));
      };
      return p;
    }

    //---------------------------------------------------------------------------------------------------------
    $convert_escaped_chrs() {
      /* TAINT prelimary */
      /* TAINT must escape for HTML, so `\<` becomes `&lt;` and so on */
      /* TAINT must consult registry of escape codes so `\n` -> U+000a but `\a` -> U+0061 */
      var escchr_tid;
      escchr_tid = 'escchr';
      return function(d, send) {
        if (d.tid !== escchr_tid) {
          return send(d);
        }
        send(stamp(d));
        return send(H.XXX_new_token('convert_escaped_chrs', d, d.mode, 'text', d.x.chr, d.x.chr));
      };
    }

  };

  // send H.XXX_new_token 'convert_escaped_chrs', d, 'html', 'text', d.x.chr, d.x.chr

    //===========================================================================================================
  Hypedown_parser = class Hypedown_parser {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      this.types = get_base_types();
      this.cfg = Object.freeze(this.types.create.hd_parser_cfg(cfg));
      this.lexer = new Hypedown_lexer();
      // debug '^234^', @lexer
      this._build_pipeline();
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _build_pipeline() {
      var tfs, tokenize_line;
      tfs = new Hypedown_transforms();
      this.pipeline = new Pipeline();
      //.........................................................................................................
      // @pipeline.push ( d ) -> urge '^_build_pipeline@1^', rpr d
      this.pipeline.push(tokenize_line = (line, send) => {
        var ref, token;
        // info '^_build_pipeline@2^', rpr line
        // info '^_build_pipeline@3^', ( t for t from @lexer.walk line )
        this.types.validate.text(line);
        ref = this.lexer.walk(line);
        for (token of ref) {
          send(token);
        }
        return null;
      });
      // @pipeline.push ( d ) -> urge '^_build_pipeline@4^', rpr d
      this.pipeline.push(tfs.$inject_virtual_nl());
      this.pipeline.push(tfs.$add_parbreak_markers());
      // @pipeline.push ( d ) -> urge '^965-1^', d
      this.pipeline.push(tfs.$parse_htmlish());
      this.pipeline.push(tfs.$parse_md_stars());
      this.pipeline.push(tfs.$parse_md_hashes({
        mode: 'plain',
        tid: 'hashes'
      }));
      this.pipeline.push(tfs.$parse_md_codespan({
        outer_mode: 'plain',
        enter_tid: 'codespan',
        inner_mode: 'cspan',
        exit_tid: 'codespan'
      }));
      this.pipeline.push(tfs.$capture_text());
      this.pipeline.push(tfs.$generate_missing_p_tags());
      this.pipeline.push(tfs.$generate_html_nls({
        mode: 'plain',
        tid: 'nl'
      }));
      this./* NOTE removes virtual nl, should come late */pipeline.push(tfs.$convert_escaped_chrs());
      // @pipeline.push ( d ) -> urge '^_build_pipeline@5^', rpr d
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    send(...P) {
      return this.pipeline.send(...P);
    }

    run(...P) {
      return this.pipeline.run(...P);
    }

    walk(...P) {
      return this.pipeline.walk(...P);
    }

    step(...P) {
      return this.pipeline.step(...P);
    }

  };

  //===========================================================================================================
  module.exports = {Hypedown_parser};

}).call(this);

//# sourceMappingURL=_hypedown-parser.js.map