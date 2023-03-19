(function() {
  'use strict';
  var $, DATOM, E, GUY, H, Hypedown_lexer, Hypedown_parser, Hypedown_parser_htmlish, Hypedown_parser_stars, Pipeline, XXX_Hypedown_transforms, XXX_TEMP, alert, debug, echo, get_base_types, help, info, inspect, lets, log, misfit, new_datom, plain, praise, rpr, stamp, transforms, urge, warn, whisper;

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

  XXX_TEMP = require('./_hypedown-parser-xxx-temp');

  ({XXX_Hypedown_transforms} = require('./_hypedown-parser-xxx-transforms'));

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
      tfs = new XXX_Hypedown_transforms();
      this.pipeline = new Pipeline();
      //.........................................................................................................
      this.pipeline.push(new XXX_TEMP.$001_Prelude());
      this.pipeline.push(tokenize_line = (line, send) => {
        var ref, token;
        this.types.validate.text(line);
        ref = this.lexer.walk(line);
        for (token of ref) {
          send(token);
        }
        return null;
      });
      // @pipeline.push tfs.$show_lexer_tokens()
      this.pipeline.push(new XXX_TEMP.$010_prepare_paragraphs());
      // @pipeline.push tfs.$inject_virtual_nl()
      // @pipeline.push tfs.$add_parbreak_markers()
      // @pipeline.push ( d ) -> urge '^965-1^', d.mk, rpr d.value
      this.pipeline.push(tfs.$parse_md_codespan());
      this.pipeline.push(tfs.$parse_htmlish());
      this.pipeline.push(tfs.$parse_md_stars());
      this.pipeline.push(tfs.$parse_md_hashes({
        mode: 'plain',
        tid: 'hashes'
      }));
      this.pipeline.push(tfs.$capture_text());
      this.pipeline.push(tfs.$generate_missing_p_tags());
      this.pipeline.push(tfs.$generate_html_nls({
        mode: 'plain',
        tid: 'nl'
      }));
      this./* NOTE removes virtual nl, should come late */pipeline.push(tfs.$convert_escaped_chrs());
      this.pipeline.push(tfs.$stamp_borders());
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