(function() {
  'use strict';
  var $, DATOM, E, GUY, Hypedown_lexer, Hypedown_parser, Hypedown_transforms, Interlex, Markdown_sx, Pipeline, Standard_sx, Syntax, XXX_new_token, alert, compose, debug, echo, get_base_types, help, info, inspect, jump_symbol, lets, log, misfit, new_datom, plain, praise, rpr, select_token, stamp, transforms, types, urge, warn, whisper;

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
  Hypedown_transforms = class Hypedown_transforms {
    //---------------------------------------------------------------------------------------------------------
    $inject_virtual_nl({mode, tid}) {
      /* normalize start of document by injecting a newline unless document already starts with one;
         thereafter, we can always check e.g. for heading markup by looking for a blank line followed by a hash
         (`#`) at the beginning of a line without having to special-case for documents starting with a hash. */
      var is_first, mk;
      is_first = true;
      mk = `${mode}:${tid}`;
      return function(d, send) {
        if (!is_first) {
          return send(d);
        }
        is_first = false;
        if (d.mk !== mk) {
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
            $: '^ø1^'
          });
        }
        return send(d);
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $inject_parbreaks({mode, tid}) {
      var inject_parbreaks, is_first, mk, p, window;
      is_first = true;
      mk = `${mode}:${tid}`;
      p = new Pipeline();
      p.push(window = transforms.$named_window({
        names: ['previous', 'current', 'ignore'],
        empty: null
      }));
      p.push(inject_parbreaks = function({previous, current}, send) {
        var ref1, ref2;
        send(current);
        debug('^98-75^', mk, (ref1 = previous != null ? previous.mk : void 0) != null ? ref1 : '---', (ref2 = previous != null ? previous.mk : void 0) != null ? ref2 : '---', select_token(previous, mk), select_token(current, mk));
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
          $: 'inject_parbreaks'
        });
      });
      return p;
    }

    //---------------------------------------------------------------------------------------------------------
    $parse_nl({mode, tid}) {
      var mk;
      mk = `${mode}:${tid}`;
      return function(d, send) {
        var ref1, ref2;
        debug('^parse_nl@1^', d);
        if (d.mk !== mk) {
          return send(d);
        }
        send(stamp(d));
        if ((ref1 = (ref2 = d.x) != null ? ref2.virtual : void 0) != null ? ref1 : false) {
          return;
        }
        return send(XXX_new_token('parse_nl', d, 'html', 'text', '\n', '\n'));
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $capture_text({mode, tid}) {
      var mk;
      mk = `${mode}:${tid}`;
      return function(d, send) {
        if (!select_token(d, mk)) {
          return send(d);
        }
        send(stamp(d));
        return send(XXX_new_token('capture_text', d, 'html', 'text', d.value, d.value));
      };
    }

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

    //---------------------------------------------------------------------------------------------------------
    $parse_md_stars({star1_tid, star2_tid, star3_tid}) {
      var enter, exit, start_of, within;
      within = {
        one: false,
        two: false
      };
      start_of = {
        one: null,
        two: null
      };
      //.......................................................................................................
      enter = function(mode, start) {
        within[mode] = true;
        start_of[mode] = start;
        return null;
      };
      enter.one = function(start) {
        return enter('one', start);
      };
      enter.two = function(start) {
        return enter('two', start);
      };
      //.......................................................................................................
      exit = function(mode) {
        within[mode] = false;
        start_of[mode] = null;
        return null;
      };
      exit.one = function() {
        return exit('one');
      };
      exit.two = function() {
        return exit('two');
      };
      //.......................................................................................................
      return function(d, send) {
        switch (d.tid) {
          //...................................................................................................
          case star1_tid:
            send(stamp(d));
            if (within.one) {
              exit.one();
              send(XXX_new_token('parse_md_stars@1^', d, 'html', 'tag', 'i', '</i>'));
            } else {
              enter.one(d.start);
              send(XXX_new_token('parse_md_stars@2^', d, 'html', 'tag', 'i', '<i>'));
            }
            break;
          //...................................................................................................
          case star2_tid:
            send(stamp(d));
            if (within.two) {
              if (within.one) {
                if (start_of.one > start_of.two) {
                  exit.one();
                  send(XXX_new_token('parse_md_stars@3^', d, 'html', 'tag', 'i', '</i>'));
                  exit.two();
                  send(XXX_new_token('parse_md_stars@4^', d, 'html', 'tag', 'b', '</b>'));
                  enter.one(d.start);
                  send(XXX_new_token('parse_md_stars@5^', d, 'html', 'tag', 'i', '<i>'));
                } else {
                  exit.two();
                  send(XXX_new_token('parse_md_stars@6^', d, 'html', 'tag', 'b', '</b>'));
                }
              } else {
                exit.two();
                send(XXX_new_token('parse_md_stars@7^', d, 'html', 'tag', 'b', '</b>'));
              }
            } else {
              enter.two(d.start);
              send(XXX_new_token('parse_md_stars@8^', d, 'html', 'tag', 'b', '<b>'));
            }
            break;
          //...................................................................................................
          case star3_tid:
            send(stamp(d));
            if (within.one) {
              if (within.two) {
                if (start_of.one > start_of.two) {
                  exit.one();
                  send(XXX_new_token('parse_md_stars@9^', d, 'html', 'tag', 'i', '</i>'));
                  exit.two();
                  send(XXX_new_token('parse_md_stars@10^', d, 'html', 'tag', 'b', '</b>'));
                } else {
                  exit.two();
                  send(XXX_new_token('parse_md_stars@11^', d, 'html', 'tag', 'b', '</b>'));
                  exit.one();
                  send(XXX_new_token('parse_md_stars@12^', d, 'html', 'tag', 'i', '</i>'));
                }
              } else {
                exit.one();
                send(XXX_new_token('parse_md_stars@13^', d, 'html', 'tag', 'i', '</i>'));
                enter.two(d.start);
                send(XXX_new_token('parse_md_stars@14^', d, 'html', 'tag', 'b', '<b>'));
              }
            } else {
              if (within.two) {
                exit.two();
                send(XXX_new_token('parse_md_stars@15^', d, 'html', 'tag', 'b', '</b>'));
                enter.one(d.start);
                send(XXX_new_token('parse_md_stars@16^', d, 'html', 'tag', 'i', '<i>'));
              } else {
                enter.two(d.start);
                send(XXX_new_token('parse_md_stars@17^', d, 'html', 'tag', 'b', '<b>'));
                enter.one(d.start + 2);
                send(XXX_new_token('parse_md_stars@18^', {
                  start: d.start + 2,
                  stop: d.stop
                }, 'html', 'tag', 'i', '<i>'));
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
        info('^211231^', rpr(line));
        ref1 = this.lexer.walk(line);
        results = [];
        for (token of ref1) {
          results.push(send(token));
        }
        return results;
      });
      this.pipeline.push(tfs.$inject_virtual_nl({
        mode: 'standard',
        tid: 'nl'
      }));
      this.pipeline.push(tfs.$inject_parbreaks({
        mode: 'standard',
        tid: 'nl'
      }));
      this.pipeline.push(tfs.$parse_md_stars({
        star1_tid: 'star1',
        star2_tid: 'star2',
        star3_tid: 'star3'
      }));
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
      this.pipeline.push(tfs.$capture_text({
        mode: 'standard',
        tid: '$catchall'
      }));
      this.pipeline.push(tfs.$parse_nl({
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