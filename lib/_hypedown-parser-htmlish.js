(function() {
  'use strict';
  var DATOM, GUY, HTMLISH, Pipeline, alert, debug, echo, help, htmlish_sym, info, inspect, lets, log, new_datom, new_parser, plain, praise, rpr, stamp, transforms, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN-PARSER/HTMLISH'));

  //...........................................................................................................
  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  ({Pipeline, transforms} = require('moonriver'));

  HTMLISH = (require('paragate/lib/htmlish.grammar')).new_grammar({
    bare: true
  });

  htmlish_sym = Symbol('htmlish');

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.Hypedown_parser_htmlish = (clasz = Object) => {
    return class extends clasz {
      //---------------------------------------------------------------------------------------------------------
      $parse_htmlish() {
        var collector, position;
        position = null;
        collector = null;
        return function(d, send) {
          /* TAINT use API */
          var i, len, t, token;
          if (d.tid === '$border') {
            if (d.x.nxt === 'tag') {
              send(d);
              collector = [];
              return position = GUY.props.pick_with_fallback(d, null, 'lnr1', 'x1');
            } else if (d.x.prv === 'tag') {
              position = {...position, ...(GUY.props.pick_with_fallback(d, null, 'lnr2', 'x2'))};
              debug('^345^', position, ((function() {
                var i, len, results;
                results = [];
                for (i = 0, len = collector.length; i < len; i++) {
                  t = collector[i];
                  results.push(t.value);
                }
                return results;
              })()).join('|'));
              token = {
                mode: 'raw-html',
                tid: 'tag',
                mk: 'raw-html:tag',
                jump: null,
                value: ((function() {
                  var i, len, results;
                  results = [];
                  for (i = 0, len = collector.length; i < len; i++) {
                    t = collector[i];
                    results.push(t.value);
                  }
                  return results;
                })()).join(''),
                // x:          null
                // $stamped:   null
                // name:       null
                lnr1: position.lnr1,
                x1: position.x1,
                lnr2: position.lnr2,
                x2: position.x2,
                $key: '^whatever',
                $: '^parse_htmlish@1^'
              };
              for (i = 0, len = collector.length; i < len; i++) {
                t = collector[i];
                //.................................................................................................
                send(stamp(t));
              }
              collector = null;
              send(token);
              return send(d);
            }
          } else if (d.mode === 'tag') {
            return collector.push(d);
          } else {
            return send(d);
          }
        };
        // urge '^parse_htmlish@1^', d
        return null;
      }

    };
  };

  //-----------------------------------------------------------------------------------------------------------
  new_parser = function(lexer) {
    var $_hd_token_from_paragate_token, $parse_htmlish_tag, $tokenize, p;
    //.........................................................................................................
    $tokenize = function(parser) {
      var tokenize;
      return tokenize = function(line, send) {
        var ref, token;
        this.types.validate.text(line);
        ref = parser.lexer.walk(line);
        for (token of ref) {
          send(token);
        }
        return null;
      };
    };
    //.........................................................................................................
    $_hd_token_from_paragate_token = function() {
      var _hd_token_from_paragate_token;
      return _hd_token_from_paragate_token = function(d, send) {
        var e, first, last, tag_types;
        if (d[htmlish_sym] == null) {
          return send(d);
        }
        first = d.$collector.at(0);
        last = d.$collector.at(-1);
        // delete d.$collector; H.tabulate "htmlish", [ d, ]
        //.....................................................................................................

        // * otag      opening tag, `<a>`
        // * ctag      closing tag, `</a>` or `</>`

        // * ntag      opening tag of `<i/italic/`
        // * nctag     closing slash of `<i/italic/`

        // * stag      self-closing tag, `<br/>`

        tag_types = {
          otag: {
            open: true,
            close: false
          },
          ctag: {
            open: false,
            close: true
          },
          ntag: {
            open: true,
            close: false
          },
          nctag: {
            open: false,
            close: true
          },
          stag: {
            open: true,
            close: true
          }
        };
        //.....................................................................................................
        e = {
          mode: 'tag',
          tid: d.type,
          mk: `tag:${d.type}`,
          jump: null,
          value: d.$source,
          /* TAINT must give first_lnr, last_lnr */
          lnr: first.lnr,
          start: first.start,
          stop: last.stop,
          x: {
            atrs: d.atrs,
            id: d.id
          },
          source: null,
          $key: '^tag'
        };
        return send(e);
      };
      return null;
    };
    //.........................................................................................................
    $parse_htmlish_tag = function() {
      var collector, parse_htmlish_tag, sp, within_tag;
      collector = [];
      within_tag = false;
      sp = new Pipeline();
      sp.push(transforms.$window({
        min: 0,
        max: +1,
        empty: null
      }));
      sp.push(parse_htmlish_tag = function([d, nxt], send) {
        var $collector, $source, e, htmlish;
        //.....................................................................................................
        if (within_tag) {
          collector.push(d);
          // debug '^parse_htmlish_tag@1^', d
          if (d.jump === 'plain'/* TAINT magic number */) {
            within_tag = false;
            $source = ((function() {
              var results;
              results = [];
              for (e of collector) {
                results.push(e.value);
              }
              return results;
            })()).join('');
            $collector = [...collector];
            while (collector.length > 0) {
              send(stamp(collector.shift()));
            }
            htmlish = HTMLISH.parse($source);
            // H.tabulate '^78^', htmlish
            // debug '^78^', rpr $source
            // info '^78^', x for x in htmlish
            if (htmlish.length !== 1) {
              /* TAINT use API to create token */
              // throw new Error "^34345^ expected single token, got #{rpr htmlish}"
              return send({
                mode: 'tag',
                tid: '$error'
              });
            }
            [htmlish] = GUY.lft.thaw(htmlish);
            htmlish[htmlish_sym] = true;
            htmlish.$collector = $collector;
            htmlish.$source = $source;
            send(htmlish);
          }
          return null;
        } else {
          if (!(nxt != null ? nxt.mk.startsWith('tag:') : void 0)) {
            //.....................................................................................................
            return send(d);
          }
          within_tag = true;
          collector.push(d);
        }
        //.....................................................................................................
        return null;
      });
      sp.push($_hd_token_from_paragate_token());
      return sp;
    };
    //.........................................................................................................
    p = new Pipeline();
    p.lexer = lexer;
    p.push($tokenize(p));
    p.push($parse_htmlish_tag());
    // p.push show = ( d ) -> urge '^parser@1^', d
    // debug '^43^', p
    return p;
  };

}).call(this);

//# sourceMappingURL=_hypedown-parser-htmlish.js.map