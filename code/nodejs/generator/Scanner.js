#! /usr/bin/env node

var fs = require('fs');
var XRegExp = require('xregexp').XRegExp;
var _ = require('underscore');

function Scanner() {

  this.patt = XRegExp(

         '(?<float> \n' +
                '\\d*\\.\\d+(?:[eE][+-]?\\d+)?        # float, dotted \n' +
                '|\\d+[eE][+-]?\\d+                  # undotted, with "e" \n' +
                ') \n' +
        '|(?<hexnum> 0x[0-9A-Fa-f]+)  # hex number \n' +
        '|(?<number> \\d+)       # number  TODO: there is no such thing in JS! \n' +
        '|(?<ident>  [$\\w]+)    # identifier, name \n' +
        /*
        '|(?<nl>                # unicode line separators \n' +
                '\x0D\x0A \n' +
                '#|\x20\x28      # strange: this is " (" !? \n' +
                '#|\x20\x29      # strange: this is " )" !? \n' +
                '|\x0A \n' +
                '|\x0D \n' +
                ') \n' +
        '|(?<white> (?:(?:\s|\ufeff)(?<!\n))+)     # white ( + BOM - \n) \n' +
        '|(?<mulop>         # multi-char operators \n' +
                '<<=?           # <<, <<= \n' +
                '|>=             # >=\n' +
                '|<=             # <=\n' +
                '|===?           # ==, ===\n' +
                '|!==?           # !=, !==\n' +
                '|[-+*\/%|^&]=    # -=, +=, *=, /=, %=, |=, ^=, &=\n' +
                '|>>>?=?         # >>, >>>, >>=, >>>=\n' +
                '|&&             # &&\n' +
                '|[|^]\|         # ||, ^|\n' +
                '|\+\+           # ++\n' +
                '|--             # --\n' +
                '|::             # ::\n' +
                '|\.\.           # ..\n' +
                '|//             # /\/ (end-of-line comment)\n' +
                '|/\*            # /\* (start multi-line comment)\n' +
                '|\*\/            # *\/ (end multi-line comment)\n' +
                ')\n' +
        '|(?<op> \W)            # what remains (operators)\n' +
        '#, re.VERBOSE|re.DOTALL|re.MULTILINE|re.UNICODE) # re.LOCALE?!\n' +
        */
        '', 'xgm'
  );

  this.tokenize = function(stream) {

    var tok, toks = [];
    var match, tok_type, source;
    var mgroups = match_groups(this.patt);

    /*
    while(true) {
      match = this.patt.xexec(stream);
      if (match===null)
        break;
      else {
    */
    this.patt.forEach(stream, function(match) {
        tok_type = mgroup(match, mgroups, 1)[0];
        source = match[0];
        tok = [tok_type, source, match.index, source.length];
        toks.push(tok);
      }
    //}
    , this);
    return toks;
  }
}

module.exports = Scanner;

// -- main --
function main(fcont) {
  var s = new Scanner();
  var tokens = s.tokenize(fcont);
  tokens.forEach(function (e) {
    console.log(e);
  });
}

function mgroup(mo, keys, i) {
  return map_select(mo, keys)[i-1];
}

/**
 * {} -> [[key,val]]  where defined(val)
 */
function map_select(obj, keys) {
  var res = [];
  keys.forEach(function (key) {
    if (defined(obj[key]))
      res.push([key, obj.key]);
  });
  return res;
}

function first(a) {
  return a[0];
}

function defined(x) {
    return !undef(x);
}

function undef(x) {
  return (typeof(x) == 'undefined');
}

function match_groups(xreg) {
  return xreg.xregexp.captureNames;
}

/*
*/
fs.readFile(process.argv[2], 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  main(data);
});



