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
  this.XXX_new_token = function(ref, token, mode, tid, name, value, start, stop, atrs = null, lexeme = null) {
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
      atrs,
      $: ref
    });
  };

}).call(this);

//# sourceMappingURL=helpers.js.map