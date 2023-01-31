(function() {
  'use strict';
  var $, $parse_md_codespan, $parse_md_star, DATOM, E, GUY, Hypedown_parser, Interlex, Markdown_sx, Pipeline, Standard_sx, Syntax, add_star1, alert, compose, debug, echo, get_base_types, help, info, inspect, jump_symbol, lets, log, misfit, new_datom, new_hypedown_lexer, new_token, plain, praise, rpr, stamp, transforms, urge, warn, whisper;

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
  new_token = function(ref, token, mode, tid, name, value, start, stop, x = null, lexeme = null) {
    /* TAINT recreation of `Interlex::new_token()` */
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
    class Standard_sx extends Syntax {
      static lx_xxx() {
        return 'xxx';
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Standard_sx.mode = 'standard';

    //---------------------------------------------------------------------------------------------------------
    Standard_sx.lx_backslash_escape = {
      tid: 'escchr',
      jump: null,
      pattern: /\\(?<chr>.)/u
    };

    Standard_sx.lx_catchall = {
      tid: 'other',
      jump: null,
      pattern: /[^*`\\]+/u
    };

    Standard_sx.lx_foo = 'foo';

    Standard_sx.lx_bar = /bar/;

    Standard_sx.lx_something = ['foo', /bar/, 'baz'];

    return Standard_sx;

  }).call(this);

  //===========================================================================================================
  Markdown_sx = class Markdown_sx extends Syntax {
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

  //-----------------------------------------------------------------------------------------------------------
  add_star1 = function(lexer, base_mode) {
    lexer.add_lexeme({
      mode: base_mode,
      tid: 'star1',
      jump: null,
      pattern: /(?<!\*)\*(?!\*)/u
    });
    return null;
  };

  //===========================================================================================================
  new_hypedown_lexer = function(mode = 'plain') {
    var d, i, len, lexeme, lexemes_lst, lexer, markdown_sx, ref1, standard_sx;
    lexer = new Interlex({
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
      lexer.add_lexeme(lexeme);
    }
    ref1 = lexer.walk("`helo` world");
    for (d of ref1) {
      help('^35-1^', d);
    }
    process.exit(111);
    // debug '^99-2^', standard_sx.backslash_escape
    // debug '^99-4^', markdown_sx.variable_codespan
    // add_backslash_escape    lexer, 'base'
    // add_star1               lexer, 'base'
    // add_variable_codespans  lexer, 'base', 'codespan'
    // add_catchall            lexer, 'base'
    return lexer;
  };

  //===========================================================================================================
  $parse_md_codespan = function(outer_mode, enter_tid, inner_mode, exit_tid) {
    /* TAINT use CFG pattern */
    /* TAINT use API for `mode:key` IDs */
    var enter_mk, exit_mk;
    enter_mk = `${outer_mode}:${enter_tid}`;
    exit_mk = `${inner_mode}:${exit_tid}`;
    return function(d, send) {
      switch (d.mk) {
        case enter_mk:
          send(stamp(d));
          send(new_token('^æ2^', d, 'html', 'tag', 'code', '<code>'));
          break;
        case exit_mk:
          send(stamp(d));
          send(new_token('^æ1^', d, 'html', 'tag', 'code', '</code>'));
          break;
        default:
          send(d);
      }
      return null;
    };
  };

  //-----------------------------------------------------------------------------------------------------------
  $parse_md_star = function(star1_tid) {
    var enter, exit, start_of, within;
    //.........................................................................................................
    within = {
      one: false
    };
    start_of = {
      one: null
    };
    //.........................................................................................................
    enter = function(mode, start) {
      within[mode] = true;
      start_of[mode] = start;
      return null;
    };
    enter.one = function(start) {
      return enter('one', start);
    };
    //.........................................................................................................
    exit = function(mode) {
      within[mode] = false;
      start_of[mode] = null;
      return null;
    };
    exit.one = function() {
      return exit('one');
    };
    //.........................................................................................................
    return function(d, send) {
      switch (d.tid) {
        //.....................................................................................................
        case star1_tid:
          send(stamp(d));
          if (within.one) {
            exit.one();
            send(new_token('^æ1^', d, 'html', 'tag', 'i', '</i>'));
          } else {
            enter.one(d.start);
            send(new_token('^æ2^', d, 'html', 'tag', 'i', '<i>'));
          }
          break;
        default:
          //.....................................................................................................
          send(d);
      }
      return null;
    };
  };

  //=========================================================================================================
  Hypedown_parser = class Hypedown_parser {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var lexer, p;
      this.types = get_base_types();
      this.cfg = Object.freeze(this.types.create.hd_constructor_cfg(cfg));
      // @start()
      // @base_mode    = null
      // @registry     = {}
      // @_metachr     = '𝔛' # used for identifying group keys
      // @_metachrlen  = @_metachr.length
      // @jump_symbol  = jump_symbol
      lexer = new_hypedown_lexer('md');
      show_lexer_as_table("toy MD lexer", lexer);
      p = new Pipeline();
      p.push(function(d, send) {
        var e, ref1, results;
        if (d.tid !== 'p') {
          return send(d);
        }
        ref1 = lexer.walk(d.value);
        results = [];
        for (e of ref1) {
          results.push(send(e));
        }
        return results;
      });
      p.push($parse_md_star('star1'));
      p.push($parse_md_codespan('base', 'codespan', 'codespan', 'codespan'));
      p.lexer = lexer;
      return void 0;
    }

  };

  //===========================================================================================================
  module.exports = {Interlex, Syntax, Standard_sx, Markdown_sx, Hypedown_parser};

}).call(this);

//# sourceMappingURL=main.js.map