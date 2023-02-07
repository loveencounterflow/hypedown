(function() {
  'use strict';
  var $, DATOM, E, GUY, Hypedown_lexer, Hypedown_parser, Hypedown_transforms, Hypedown_transforms_stars, Interlex, Markdown_sx, Pipeline, Standard_sx, Syntax, XXX_new_token, alert, compose, debug, echo, get_base_types, help, info, inspect, jump_symbol, lets, log, misfit, new_datom, plain, praise, rpr, select_token, stamp, transforms, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN'));

  //...........................................................................................................
  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  //...........................................................................................................
  ({Pipeline, $, transforms} = require('moonriver'));

  //...........................................................................................................
  ({Interlex, Syntax, compose} = require('intertext-lexer'));

  //...........................................................................................................
  ({misfit, jump_symbol, get_base_types} = require('./types'));

  E = require('./errors');

  types = new (require('intertype')).Intertype();

  ({Hypedown_transforms_stars} = require('./_hypedown-transforms-stars'));

  //-----------------------------------------------------------------------------------------------------------
  select_token = function(token, selector) {
    var ref1;
    if (token == null) {
      return false;
    }
    if ((ref1 = token.$stamped) != null ? ref1 : false) {
      return false;
    }
    return token.mk === selector;
  };

  //-----------------------------------------------------------------------------------------------------------
  XXX_new_token = function(ref, token, mode, tid, name, value, start, stop, x = null, lexeme = null) {
    /* TAINT recreation of `Interlex::XXX_new_token()` */
    var jump, ref1;
    jump = (ref1 = lexeme != null ? lexeme.jump : void 0) != null ? ref1 : null;
    ({start, stop} = token);
    return new_datom(`^${mode}`, {
      mode,
      tid,
      mk: `${mode}:${tid}`,
      jump,
      name,
      value,
      start,
      stop,
      x,
      $: ref
    });
  };

  Standard_sx = (function() {
    //===========================================================================================================
    class Standard_sx extends Syntax {};

    //---------------------------------------------------------------------------------------------------------
    Standard_sx.mode = 'standard';

    //---------------------------------------------------------------------------------------------------------
    Standard_sx.lx_backslash_escape = {
      tid: 'escchr',
      jump: null,
      pattern: /\\(?<chr>.)/u,
      reserved: '\\'
    };

    return Standard_sx;

  }).call(this);

  Markdown_sx = (function() {
    /* TAINT use 'forbidden chrs' (to be implemented) */
    // @lx_catchall:          { tid: 'other',  jump: null, pattern: /[^*`\\#]+/u, }

      // @lx_foo: 'foo'
    // @lx_bar: /bar/
    // @lx_something: [ 'foo', /bar/, 'baz', ]
    // @lx_xxx: -> 'xxx'

      //===========================================================================================================
    class Markdown_sx extends Syntax {
      //---------------------------------------------------------------------------------------------------------
      /* TAINT handle CFG format which in this case includes `codespan_mode` */
      constructor(cfg) {
        super({
          codespan_mode: 'codespan',
          ...cfg
        });
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      static lx_variable_codespan(cfg) {
        var backtick_count, entry_handler, exit_handler;
        backtick_count = null;
        //.......................................................................................................
        entry_handler = ({token, match, lexer}) => {
          backtick_count = token.value.length;
          return this.cfg.codespan_mode;
        };
        //.......................................................................................................
        exit_handler = function({token, match, lexer}) {
          if (token.value.length === backtick_count) {
            backtick_count = null;
            return '^';
          }
          token = lets(token, function(token) {
            token.tid = 'text';
            return token.mk = `${token.mode}:text`;
          });
          return {token};
        };
        return [
          {
            //.......................................................................................................
            // info '^3531^', @cfg
            mode: this.cfg.mode,
            tid: 'codespan',
            jump: entry_handler,
            pattern: /(?<!`)`+(?!`)/u,
            reserved: '`'
          },
          {
            mode: this.cfg.codespan_mode,
            tid: 'codespan',
            jump: exit_handler,
            pattern: /(?<!`)`+(?!`)/u,
            reserved: '`'
          },
          {
            /* NOTE this could be produced with `lexer.add_catchall_lexeme()` */
            mode: this.cfg.codespan_mode,
            tid: 'text',
            jump: null,
            pattern: /(?:\\`|[^`])+/u
          }
        ];
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Markdown_sx.lx_nl = /$/u;

    //---------------------------------------------------------------------------------------------------------
    Markdown_sx.lx_star1 = /(?<!\*)\*(?!\*)/u;

    Markdown_sx.lx_star2 = /(?<!\*)\*\*(?!\*)/u;

    Markdown_sx.lx_star3 = /(?<!\*)\*\*\*(?!\*)/u;

    //---------------------------------------------------------------------------------------------------------
    Markdown_sx.lx_hashes = /^(?<text>#{1,6})($|\s+)/u;

    return Markdown_sx;

  }).call(this);

  //===========================================================================================================
  Hypedown_lexer = class Hypedown_lexer extends Interlex {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      var i, len, lexeme, lexemes_lst, markdown_sx, standard_sx;
      super({
        catchall_concat: true,
        reserved_concat: true
      });
      standard_sx = new Standard_sx();
      markdown_sx = new Markdown_sx({
        mode: 'standard',
        codespan_mode: 'cspan'
      });
      lexemes_lst = [];
      standard_sx.add_lexemes(lexemes_lst);
      markdown_sx.add_lexemes(lexemes_lst);
      for (i = 0, len = lexemes_lst.length; i < len; i++) {
        lexeme = lexemes_lst[i];
        this.add_lexeme(lexeme);
      }
      this.add_catchall_lexeme({
        mode: 'standard'
      });
      this.add_reserved_lexeme({
        mode: 'standard'
      });
      return void 0;
    }

  };

  //===========================================================================================================
  /* TAINT temporary quick fix solution; might use mixins or similar in the future */
  Hypedown_transforms = class Hypedown_transforms extends Hypedown_transforms_stars {
    //=========================================================================================================
    // PREPARATION
    //---------------------------------------------------------------------------------------------------------
    $inject_virtual_nl() {
      /* normalize start of document by injecting two newlines. */
      var is_first, mk, mode, tid;
      is_first = true;
      mode = 'standard';
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
          $key: '^standard',
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
          $key: '^standard',
          $: 'inject_virtual_nl'
        });
        return send(d);
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $add_parbreak_markers()/* needs inject_virtual_nl */ {
      var add_parbreak_markers, is_first, mk, mode, p, window;
      is_first = true;
      mode = 'standard';
      mk = "standard:nl";
      p = new Pipeline();
      p.push(window = transforms.$window({
        min: -2,
        max: 0,
        empty: null
      }));
      p.push(add_parbreak_markers = function([lookbehind, previous, current], send) {
        send(current);
        // debug '^98-75^', mk, ( lookbehind?.mk ? '---' ), ( previous?.mk ? '---' ), ( previous?.mk ? '---' ), ( select_token previous, mk ), ( select_token current, mk )
        if (select_token(lookbehind, mk)) {
          return;
        }
        if (!((select_token(previous, mk)) && (select_token(current, mk)))) {
          return;
        }
        // unless d.mk is mk
        return send({
          mode,
          tid: 'p',
          mk: `${mode}:p`,
          jump: null,
          value: '',
          start: 0,
          stop: 0,
          $key: '^standard',
          $: 'add_parbreak_markers'
        });
      });
      return p;
    }

    //=========================================================================================================
    // PREPARATION
    //---------------------------------------------------------------------------------------------------------
    $parse_md_codespan({outer_mode, enter_tid, inner_mode, exit_tid}) {
      /* TAINT use CFG pattern */
      /* TAINT use API for `mode:key` IDs */
      var enter_mk, exit_mk;
      enter_mk = `${outer_mode}:${enter_tid}`;
      exit_mk = `${inner_mode}:${exit_tid}`;
      return function(d, send) {
        switch (d.mk) {
          case enter_mk:
            send(stamp(d));
            send(XXX_new_token('parse_md_codespan', d, 'html', 'tag', 'code', '<code>'));
            break;
          case exit_mk:
            send(stamp(d));
            send(XXX_new_token('parse_md_codespan', d, 'html', 'tag', 'code', '</code>'));
            break;
          default:
            send(d);
        }
        return null;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $parse_md_hashes({mode, tid}) {
      var hashes_mk, prv_was_empty;
      if (mode == null) {
        mode = 'standard';
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
        send(XXX_new_token('parse_md_hashes', d, 'html', 'tag', name, `<${name}>`));
        return null;
      };
    }

    //=========================================================================================================
    // FINALIZATION
    //---------------------------------------------------------------------------------------------------------
    $generate_p_tags({mode, tid})/* precedes generate_html_nls, needs add_parbreak_markers */ {
      /* NOTE

      * https://stackoverflow.com/questions/8460993/p-end-tag-p-is-not-needed-in-html

      For the time being we opt for *not* using closing `</p>` tags, the reason for this being that they are
      not required by HTML5, and it *may* (just may) make things easier down the line when the closing tag is
      made implicit. However, observe that the very similar `<div>` tag still has to be closed explicitly.

       */
      var mk;
      mk = `${mode}:${tid}`;
      return function(d, send) {
        if (d.mk !== mk) {
          // debug '^generate_html_nls@1^', d
          return send(d);
        }
        send(stamp(d));
        return send(XXX_new_token('generate_p_tags', d, 'html', 'text', '<p>', '<p>'));
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $capture_text() {
      var mk;
      mk = "standard:#$catchall";
      return function(d, send) {
        if (!select_token(d, mk)) {
          return send(d);
        }
        send(stamp(d));
        return send(XXX_new_token('capture_text', d, 'html', 'text', d.value, d.value));
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $generate_html_nls()/* needs generate_p_tags */ {
      var mk, p, window;
      mk = "standard:nl";
      p = new Pipeline();
      p.push(window = transforms.$window({
        min: -2,
        max: 0,
        empty: null
      }));
      p.push(function([previous, current, next], send) {
        var ref1, ref2;
        debug('^generate_html_nls@1^', [previous != null ? previous.mk : void 0, previous != null ? previous.value : void 0], [current != null ? current.mk : void 0, current != null ? current.value : void 0], [next != null ? next.mk : void 0, next != null ? next.value : void 0]);
        if (current == null) {
          return;
        }
        return send(current);
        if (d.mk !== mk) {
          return send(d);
        }
        send(stamp(d));
        if ((ref1 = (ref2 = d.x) != null ? ref2.virtual : void 0) != null ? ref1 : false) {
          return;
        }
        return send(XXX_new_token('generate_html_nls', d, 'html', 'text', '\n', '\n'));
      });
      return p;
    }

  };

  //===========================================================================================================
  Hypedown_parser = class Hypedown_parser {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      this.types = get_base_types();
      this.cfg = Object.freeze(this.types.create.hd_parser_cfg(cfg));
      this.lexer = new Hypedown_lexer({
        mode: 'standard'
      });
      // debug '^234^', @lexer
      this._build_pipeline();
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _build_pipeline() {
      var tfs;
      tfs = new Hypedown_transforms();
      this.pipeline = new Pipeline();
      this.pipeline.push((line, send) => {
        var ref1, results, token;
        if (!types.isa.text(line)) {
          return send(line);
        }
        ref1 = this.lexer.walk(line);
        results = [];
        for (token of ref1) {
          // info '^211231^', rpr line
          results.push(send(token));
        }
        return results;
      });
      this.pipeline.push(tfs.$inject_virtual_nl());
      this.pipeline.push(tfs.$add_parbreak_markers());
      // @pipeline.push ( d ) -> urge '^965-1^', d
      this.pipeline.push(tfs.$parse_md_stars());
      this.pipeline.push(tfs.$parse_md_hashes({
        mode: 'standard',
        tid: 'hashes'
      }));
      this.pipeline.push(tfs.$parse_md_codespan({
        outer_mode: 'standard',
        enter_tid: 'codespan',
        inner_mode: 'cspan',
        exit_tid: 'codespan'
      }));
      this.pipeline.push(tfs.$capture_text());
      this.pipeline.push(tfs.$generate_p_tags({
        mode: 'standard',
        tid: 'p'
      }));
      this.pipeline.push(tfs.$generate_html_nls({
        mode: 'standard',
        tid: 'nl'
      }));
/* NOTE removes virtual nl, should come late */      return null;
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
  module.exports = {XXX_new_token, Interlex, Syntax, Standard_sx, Markdown_sx, Hypedown_lexer, Hypedown_parser};

}).call(this);

//# sourceMappingURL=main.js.map