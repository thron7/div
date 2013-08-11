#! /usr/bin/env node

var fs = require('fs');

function Scanner() {

  this.patt = new RegExp('

         (?P<float>
                 \d*\.\d+(?:[eE][+-]?\d+)?        // float, dotted
                |\d+[eE][+-]?\d+                  // undotted, with 'e'
                )
        |(?P<hexnum> 0x[0-9A-Fa-f]+)  // hex number
        |(?P<number> \d+)       // number  TODO: there is no such thing in JS!
        |(?P<ident>  [$\w]+)    // identifier, name
        |(?P<nl>                // unicode line separators
                 \x0D\x0A
                //|\x20\x28      // strange: this is ' (' !?
                //|\x20\x29      // strange: this is ' )' !?
                |\x0A
                |\x0D
                )
        |(?P<white> (?:(?:\s|\ufeff)(?<!\n))+)     // white ( + BOM - \n)
        |(?P<mulop>         // multi-char operators
                 <<=?           // <<, <<=
                |>=             // >=
                |<=             // <=
                |===?           // ==, ===
                |!==?           // !=, !==
                |[-+*/%|^&]=    // -=, +=, *=, /=, %=, |=, ^=, &=
                |>>>?=?         // >>, >>>, >>=, >>>=
                |&&             // &&
                |[|^]\|         // ||, ^|
                |\+\+           // ++
                |--             // --
                |::             // ::
                |\.\.           // ..
                |//             // // (end-of-line comment)
                |/\*            // /* (start multi-line comment)
                |\*/            // */ (end multi-line comment)
                )
        |(?P<op> \W)            // what remains (operators)
        //, re.VERBOSE|re.DOTALL|re.MULTILINE|re.UNICODE) // re.LOCALE?!
        ', 'gm'
  );

  this.tokenize = function(stream) {
    var tok, toks = [];
    var match, tok_type, source;
    while(true) {
      tok = {};
      match = this.patt.exec(stream);
      if (match===null)
        break;
      else {
        tok_type = 'foo'; // TODO
        source = match[0];
        tok = [tok_type, source, match.index, source.length];
        toks.push(tok);
      }
    }
    return toks;
  }
}

function main(fcont) {
  var s = new Scanner();
  var tokens = s.tokenize(fcont);
  tokens.forEach(function (e) {
    console.log(e);
}

// -- main --
fs.readFile(process.argv[2], 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  main(data);
}
