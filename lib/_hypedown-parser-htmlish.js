(function() {
  'use strict';
  var DATOM, GUY, HTMLISH, Pipeline, TR, alert, debug, echo, help, info, inspect, lets, log, new_datom, plain, praise, rpr, stamp, transforms, urge, warn, whisper,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

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

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  TR = require('./tag-registry');

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.Hypedown_parser_htmlish = (clasz = Object) => {
    var _class;
    return _class = class extends clasz {
      constructor() {
        super(...arguments);
        //---------------------------------------------------------------------------------------------------------
        this.$_normalize_tag_tokens = this.$_normalize_tag_tokens.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.$_collect_tag_tokens = this.$_collect_tag_tokens.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.$_parse_tag_source = this.$_parse_tag_source.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.$_parse_sole_slash = this.$_parse_sole_slash.bind(this);
      }

      //---------------------------------------------------------------------------------------------------------
      _hd_token_from_paragate_token(hd_token, pg_token) {
        var R, ref, tid;
        //.......................................................................................................
        if (pg_token.$key === '^error') {
          tid = '$error';
        } else {
          if ((tid = (ref = TR.pg_and_hd_tags[pg_token.type]) != null ? ref.type : void 0) == null) {
            debug('^35345^', hd_token);
            debug('^35345^', pg_token);
            return GUY.lft.lets(hd_token, (d) => {
              var message;
              message = `unable to find pg_token.type ${rpr(pg_token.type)} in TR.pg_and_hd_tags`;
              d.mode = 'tag';
              d.tid = '$error';
              d.data = {...d.data, message, hd_token};
              return d.$ = '^_hd_token_from_paragate_token@1^';
            });
          }
        }
        //.......................................................................................................
        R = {
          mode: 'tag',
          tid: tid,
          jump: null,
          value: hd_token.value,
          /* TAINT must give first_lnr, last_lnr */
          data: {...TR.pg_and_hd_tags[pg_token.type]},
          lnr1: hd_token.lnr1,
          x1: hd_token.x1,
          lnr2: hd_token.lnr2,
          x2: hd_token.x2
        };
        R.mk = `${R.mode}:${R.tid}`;
        if (pg_token.atrs != null) {
          R.data.atrs = pg_token.atrs;
        }
        if (pg_token.id != null) {
          R.data.id = pg_token.id;
        }
        if (pg_token.$key === '^error') {
          R.data.code = pg_token.code;
          R.data.message = pg_token.message;
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      $parse_htmlish() {
        var p;
        p = new Pipeline();
        p.push(this.$_normalize_tag_tokens());
        p.push(this.$_collect_tag_tokens());
        p.push(this.$_parse_tag_source());
        p.push(this.$_parse_sole_slash());
        return p;
      }

      $_normalize_tag_tokens() {
        var _normalize_tag_tokens;
        boundMethodCheck(this, _class);
        return _normalize_tag_tokens = (d, send) => {
          var data;
          if (d.mode !== 'tag') {
            return send(d);
          }
          if ((data = TR.pg_and_hd_tags[d.tid]) == null) {
            return send(d);
          }
          return send(GUY.lft.lets(d, function(d) {
            return d.data = {...d.data, ...data};
          }));
        };
      }

      $_collect_tag_tokens() {
        var _collect_tag_tokens, collector, position;
        boundMethodCheck(this, _class);
        position = null;
        collector = null;
        return _collect_tag_tokens = (d, send) => {
          var first_token, i, len, ref, ref1, ref2, t, token;
          if (d.tid === '$border') {
            //...................................................................................................
            if (d.data.nxt === 'tag') {
              send(d);
              collector = [];
              return position = GUY.props.pick_with_fallback(d, null, 'lnr1', 'x1');
            //...................................................................................................
            } else if (d.data.prv === 'tag') {
              if ((collector.length === 1) && !((ref = (ref1 = (first_token = collector[0])) != null ? (ref2 = ref1.data) != null ? ref2.parse : void 0 : void 0) != null ? ref : true)) {
                collector = null;
                return send(first_token);
              }
              //.................................................................................................
              position = {...position, ...(GUY.props.pick_with_fallback(d, null, 'lnr2', 'x2'))};
              // debug '^345^', position, ( t.value for t in collector ).join '|'
              /* TAINT use API */
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

      $_parse_tag_source() {
        var _parse_tag_source;
        boundMethodCheck(this, _class);
        return _parse_tag_source = (d, send) => {
          var i, len, pg_token, pg_tokens;
          if (d.mk !== 'raw-html:tag') {
            return send(d);
          }
          // send stamp d ### NOTE intentionally hiding `raw-html` token as it is condiered an implementation detail ###
          pg_tokens = HTMLISH.parse(d.value);
          for (i = 0, len = pg_tokens.length; i < len; i++) {
            pg_token = pg_tokens[i];
            // unless pg_tokens.length is 1
            //   ### TAINT use API to create token ###
            //   return send { mode: 'tag', tid: '$error', \
            //     data: { message: "expected single token, got #{rpr pg_tokens}", }, $: '^_parse_tag_source@1^', }
            // [ pg_token ]           = GUY.lft.thaw pg_tokens
            send(this._hd_token_from_paragate_token(d, pg_token));
          }
          return null;
        };
      }

      $_parse_sole_slash() {
        var _parse_sole_slash, tag_type_stack;
        boundMethodCheck(this, _class);
        tag_type_stack = [];
        return _parse_sole_slash = (d, send) => {
          switch (d.mk) {
            case 'tag:otag':
            case 'tag:ctag':
            case 'tag:ntag':
            case 'tag:nctag':
            case 'tag:stag':
              tag_type_stack.push(d.type);
              send(d);
              break;
            case 'plain:slash':
              // debug '^_parse_sole_slash@1^', tag_type_stack
              send(stamp(d));
              null;
              break;
            default:
              send(d);
          }
          return null;
        };
      }

    };
  };

  // #-----------------------------------------------------------------------------------------------------------
// new_parser = ( lexer ) ->

  //   #.........................................................................................................
//   $_hd_token_from_paragate_token = ->
//   #.........................................................................................................
//   $parse_htmlish_tag  = ->
//     collector   = []
//     within_tag  = false
//     sp          = new Pipeline()
//     sp.push transforms.$window { min: 0, max: +1, empty: null, }
//     sp.push parse_htmlish_tag = ( [ d, nxt, ], send ) ->
//       #.....................................................................................................
//       if within_tag
//         collector.push d
//         # debug '^parse_htmlish_tag@1^', d
//         if d.jump is 'plain' ### TAINT magic number ###
//           within_tag  = false
//           $source     = ( e.value for e from collector ).join ''
//           $collector  = [ collector..., ]
//           send stamp collector.shift() while collector.length > 0
//           htmlish     = HTMLISH.parse $source
//           # H.tabulate '^78^', htmlish
//           # debug '^78^', rpr $source
//           # info '^78^', x for x in htmlish
//           unless htmlish.length is 1
//             ### TAINT use API to create token ###
//             # throw new Error "^34345^ expected single token, got #{rpr htmlish}"
//             return send { mode: 'tag', tid: '$error', }
//           [ htmlish ]           = GUY.lft.thaw htmlish
//           htmlish[htmlish_sym]  = true
//           htmlish.$collector    = $collector
//           htmlish.$source       = $source
//           send htmlish
//         return null
//       #.....................................................................................................
//       else
//         return send d unless nxt?.mk.startsWith 'tag:'
//         within_tag = true
//         collector.push d
//       #.....................................................................................................
//       return null
//     sp.push $_hd_token_from_paragate_token()
//     return sp
//   #.........................................................................................................
//   p             = new Pipeline()
//   p.lexer       = lexer
//   p.push $tokenize p
//   p.push $parse_htmlish_tag()
//   # p.push show = ( d ) -> urge '^parser@1^', d
//   # debug '^43^', p
//   return p

}).call(this);

//# sourceMappingURL=_hypedown-parser-htmlish.js.map