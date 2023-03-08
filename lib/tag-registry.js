(function() {
  //-----------------------------------------------------------------------------------------------------------
  this.pg_and_hd_tags = {
    otag: {
      type: 'o_ltr',
      open: true,
      close: false,
      parse: true // opening tag, `<t>`
    },
    ctag: {
      type: 'c_lstr',
      open: false,
      close: true,
      parse: true // closing tag, `</t>` or `</>`
    },
    ntag: {
      type: 'o_lts',
      open: true,
      close: false,
      parse: true // opening tag of `<t/italic/`
    },
    nctag: {
      type: 'c_s',
      open: false,
      close: true,
      parse: false // closing slash of `<t/italic/`
    },
    stag: {
      type: 'oc_ltsr',
      open: true,
      close: true,
      parse: true // self-closing tag, `<br/>`
    },
    c_lsr: {
      type: 'c_lsr',
      open: false,
      close: true,
      parse: false // `</>`
    }
  };

  /*
| nr |         sample        |   w/out atrs   | ws | open | close |  schematic  |      pg_tag      |
|----|-----------------------|----------------|----|------|-------|-------------|------------------|
|  1 | `ooo<t>iii`           | `<t>`          | ✔  | ✔    | ❌     | **O-LTR**   | otag             |
|  2 | `iii</>ooo`           | `</>`          | ❌  | ❌    | ✔     | **C-LSR**   | ctag<sup>1</sup> |
|  3 | `iii</t>ooo`          | `</t>`         | ❌  | ❌    | ✔     | **C-LSTR**  | ctag<sup>2</sup> |
|  4 | `ooo<t/iii`           | `<t/(?!>)`     | ✔  | ✔    | ❌     | **O-LT**    | ntag             |
|  5 | `iii/ooo`<sup>3</sup> | `(?<!<)/(?!>)` | ❌  | ❌    | ✔     | **C-S**     | nctag            |
|  6 | `ooo<t/>ooo`          | `<t/>`         | ✔  | ✔    | ✔     | **OC-LTSR** | stag             |
 */

}).call(this);

//# sourceMappingURL=tag-registry.js.map