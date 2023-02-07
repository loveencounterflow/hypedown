(function() {
  'use strict';
  var DATOM, E, GUY, Hypedown_lexer, Interlex, Markdown_sx, Standard_sx, Syntax, alert, compose, debug, echo, get_base_types, help, info, inspect, lets, log, misfit, new_datom, plain, praise, rpr, stamp, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN/HYPEDOWN-LEXER'));

  //...........................................................................................................
  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  //...........................................................................................................
  ({Interlex, Syntax, compose} = require('intertext-lexer'));

  //...........................................................................................................
  ({misfit, get_base_types} = require('./types'));

  E = require('./errors');

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
  module.exports = {Markdown_sx, Standard_sx, Hypedown_lexer};

}).call(this);

//# sourceMappingURL=_hypedown-lexer.js.map