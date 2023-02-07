(function() {
  this.Hypedown_transforms_stars = class Hypedown_transforms_stars {
    //---------------------------------------------------------------------------------------------------------
    $parse_md_stars() {
      var enter, exit, star1_mk, star2_mk, star3_mk, start_of, within;
      star1_mk = 'standard:star1';
      star2_mk = 'standard:star2';
      star3_mk = 'standard:star3';
      //.......................................................................................................
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
        switch (d.mk) {
          //...................................................................................................
          case star1_mk:
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
          case star2_mk:
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
          case star3_mk:
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

}).call(this);

//# sourceMappingURL=_hypedown-transforms-stars.js.map