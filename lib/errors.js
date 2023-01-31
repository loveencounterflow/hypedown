(function() {
  'use strict';
  var rpr;

  //###########################################################################################################
  ({rpr} = (require('guy')).trm);

  //-----------------------------------------------------------------------------------------------------------
  this.Hypedown_error = class Hypedown_error extends Error {
    constructor(ref, message) {
      super();
      this.message = `${ref} (${this.constructor.name}) ${message}`;
      this.ref = ref;
      return void 0/* always return `undefined` from constructor */;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  this.Hypedown_internal_error = class Hypedown_internal_error extends this.Hypedown_error {
    constructor(ref, message) {
      super(ref, message);
    }

  };

  this.Hypedown_not_implemented = class Hypedown_not_implemented extends this.Hypedown_error {
    constructor(ref, feature) {
      super(ref, `${feature} not implemented`);
    }

  };

  this.Hypedown_TBDUNCLASSIFIED = class Hypedown_TBDUNCLASSIFIED extends this.Hypedown_error {
    constructor(ref, message) {
      super(ref, message);
    }

  };

}).call(this);

//# sourceMappingURL=errors.js.map