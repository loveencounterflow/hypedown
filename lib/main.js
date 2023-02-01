(function() {
  'use strict';
  var $, DATOM, E, GUY, Hypedown_lexer, Hypedown_parser, Hypedown_transforms, Interlex, Markdown_sx, Pipeline, Standard_sx, Syntax, XXX_new_token, alert, compose, debug, echo, get_base_types, help, info, inspect, jump_symbol, lets, log, misfit, new_datom, plain, praise, rpr, stamp, transforms, urge, warn, whisper;

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
      pattern: /\\(?<chr>.)/u
    };

    /* TAINT use 'forbidden chrs' (to be implemented) */
    Standard_sx.lx_catchall = {
      tid: 'other',
      jump: null,
      pattern: /[^*`\\]+/u
    };

    return Standard_sx;

  }).call(this);

  Markdown_sx = (function() {
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
            pattern: /(?<!`)`+(?!`)/u
          },
          {
            mode: this.cfg.codespan_mode,
            tid: 'codespan',
            jump: exit_handler,
            pattern: /(?<!`)`+(?!`)/u
          },
          {
            mode: this.cfg.codespan_mode,
            tid: 'text',
            jump: null,
            pattern: /(?:\\`|[^`])+/u
          }
        ];
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Markdown_sx.lx_star1 = /(?<!\*)\*(?!\*)/u;

    return Markdown_sx;

  }).call(this);

  //===========================================================================================================
  Hypedown_lexer = class Hypedown_lexer extends Interlex {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      var i, len, lexeme, lexemes_lst, markdown_sx, standard_sx;
      super({
        dotall: false
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
      return void 0;
    }

  };

  //===========================================================================================================
  Hypedown_transforms = class Hypedown_transforms {
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
            send(XXX_new_token('^æ2^', d, 'html', 'tag', 'code', '<code>'));
            break;
          case exit_mk:
            send(stamp(d));
            send(XXX_new_token('^æ1^', d, 'html', 'tag', 'code', '</code>'));
            break;
          default:
            send(d);
        }
        return null;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    $parse_md_star({star1_tid}) {
      var enter, exit, start_of, within;
      /* TAINT use CFG pattern */
      //.......................................................................................................
      within = {
        one: false
      };
      start_of = {
        one: null
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
      //.......................................................................................................
      exit = function(mode) {
        within[mode] = false;
        start_of[mode] = null;
        return null;
      };
      exit.one = function() {
        return exit('one');
      };
      //.......................................................................................................
      return function(d, send) {
        switch (d.tid) {
          //...................................................................................................
          case star1_tid:
            send(stamp(d));
            if (within.one) {
              exit.one();
              send(XXX_new_token('^æ1^', d, 'html', 'tag', 'i', '</i>'));
            } else {
              enter.one(d.start);
              send(XXX_new_token('^æ2^', d, 'html', 'tag', 'i', '<i>'));
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
      this.pipeline.push((d, send) => {
        var e, ref1, results;
        if (d.tid !== 'p') {
          return send(d);
        }
        ref1 = this.lexer.walk(d.value);
        results = [];
        for (e of ref1) {
          results.push(send(e));
        }
        return results;
      });
      this.pipeline.push(tfs.$parse_md_star({
        star1_tid: 'star1'
      }));
      this.pipeline.push(tfs.$parse_md_codespan({
        outer_mode: 'standard',
        enter_tid: 'codespan',
        inner_mode: 'cspan',
        exit_tid: 'codespan'
      }));
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
  module.exports = {XXX_new_token, Interlex, Syntax, Standard_sx, Markdown_sx, Hypedown_lexer, Hypedown_parser};

}).call(this);

//# sourceMappingURL=main.js.map