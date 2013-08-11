#/opt/local/bin/node

function Scanner() {

  this.patt = new RegExp(

         (?P<float>
                 \d*\.\d+(?:[eE][+-]?\d+)?        # float, dotted
                |\d+[eE][+-]?\d+                  # undotted, with 'e'
                )
        |(?P<hexnum> 0x[0-9A-Fa-f]+)  # hex number
        |(?P<number> \d+)       # number  TODO: there is no such thing in JS!
        |(?P<ident>  [$\w]+)    # identifier, name
        |(?P<nl>                # unicode line separators
                 \x0D\x0A
                #|\x20\x28      # strange: this is ' (' !?
                #|\x20\x29      # strange: this is ' )' !?
                |\x0A
                |\x0D
                )
        |(?P<white> (?:(?:\s|\ufeff)(?<!\n))+)     # white ( + BOM - \n)
        |(?P<mulop>         # multi-char operators
                 <<=?           # <<, <<=
                |>=             # >=
                |<=             # <=
                |===?           # ==, ===
                |!==?           # !=, !==
                |[-+*/%|^&]=    # -=, +=, *=, /=, %=, |=, ^=, &=
                |>>>?=?         # >>, >>>, >>=, >>>=
                |&&             # &&
                |[|^]\|         # ||, ^|
                |\+\+           # ++
                |--             # --
                |::             # ::
                |\.\.           # ..
                |//             # // (end-of-line comment)
                |/\*            # /* (start multi-line comment)
                |\*/            # */ (end multi-line comment)
                )
        |(?P<op> \W)            # what remains (operators)
        ''', re.VERBOSE|re.DOTALL|re.MULTILINE|re.UNICODE) # re.LOCALE?!
  );
}

var s = new Scanner();
