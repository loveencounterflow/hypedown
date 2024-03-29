(function() {
  'use strict';
  var DATOM, GUY, alert, debug, echo, help, info, inspect, lets, log, new_datom, plain, praise, rpr, stamp, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('HYPEDOWN-PARSER/HELPERS'));

  //...........................................................................................................
  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  ({DATOM} = require('datom'));

  //...........................................................................................................
  ({new_datom, lets, stamp} = DATOM);

  //-----------------------------------------------------------------------------------------------------------
  this.XXX_new_token = function(ref, token, mode, tid, name, value, start, stop, data = null, lexeme = null) {
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
      lnr1: null,
      x1: null,
      lnr2: null,
      x2: null,
      data,
      $: ref
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.select_token = function(token, selector) {
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
  this.get_position = function(token) {
    return GUY.props.pick_with_fallback(token, null, 'lnr1', 'x1', 'lnr2', 'x2');
  };

}).call(this);

//# sourceMappingURL=helpers.js.map