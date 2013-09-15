#!/usr/bin/env node

var fs = require('fs');
var Scanner = require('./Scanner');

function Node() {

  this.type = null;
  this.parent = null;
  this.children = [];
  this.attributes = {};

  this.set = function (key, val) {
      this.attributes[key] = val;
  };
  this.get = function (key, def) {
      if (defined(this.attributes[key]))
        return this.attributes[key];
      else if (defined(def))
        return def;
      else
        throw new Error('unknown attribute');
  };

  this.childappend = function (cld) {
      this.children.push(cld);
      cld.parent = this;
  }
}

var symbol_table = {};

function symbol(name, bpleft) {
  if (defined(symbol_table[name]) {
      if (bpleft) {
          symbol_table[name].bp = bpleft
      }
  } else {
      cls = function () {
          Node.call(this, arguments);  
      };
      cls.prototype = new Node();
      cls.type = name;
      cls.bp = bpleft ? bpleft : 0;
      symbol_table[name] = cls;
  }
  return symbol_table[name];
}

// Helpers
function identity () { return this; }

// =============================================================================
// constant
symbol("constant").pfix = identity;

symbol("(unknown)").pfix = lambda self: self
symbol("eol")
symbol("eof")


symbol("constant").pfix = lambda self: self

@method(symbol("constant"))
def toJS(self, opts):
    r = u''
    if self.get("constantType") == "string":
        quote = "'" if self.get("detail")=="singlequotes" else '"'
        r += quote + self.write(self.get("value")) + quote
    else:
        r += self.write(self.get("value"))
    return r

@method(symbol("constant"))
def toListG(self):
    yield self

symbol("identifier")

@method(symbol("identifier"))
def pfix(self):
    return self

@method(symbol("identifier"))
def toJS(self, opts):
    r = u''
    v = self.get("value", u"")
    if v:
        r = self.write(v)
    return r

@method(symbol("identifier"))
def toListG(self):
    yield self


#@method(symbol("/"))   # regexp literals - already detected by the Tokenizer
#def pfix(self):
#    pass


# ternary op ?:
@method(symbol("?"))
def ifix(self, left):
    # first
    self.childappend(left)
    # second
    self.childappend(expression(symbol(":").bind_left +1))
    advance(":")
    # third
    self.childappend(expression(symbol(",").bind_left +1))
    return self


@method(symbol("?"))
def toJS(self, opts):
    r = []
    r.append(self.children[0].toJS(opts))
    r.append('?')
    r.append(self.children[1].toJS(opts))
    r.append(':')
    r.append(self.children[2].toJS(opts))
    return ''.join(r)

@method(symbol("?"))
def toListG(self):
    for e in itert.chain(self.children[0].toListG(), [self], self.children[1].toListG(), self.children[2].toListG()):
        yield e


##
# The case of <variable>:
# <variable> is an important node in the old ast, I think because as it mainly
# guides dependency analysis, which has to look for variable names. So it might
# be a good trap to have a <variable> node wrapper on all interesting places.
#   I'm keeping it here for the "." (dotaccessor) and for the <identifier>'s,
# because these are the interesting nodes that contain variable names. I'm not
# keeping it for the "[" (accessor) construct, as "foo[bar]" seems more naturally
# divided into the variable part "foo", and something else in the selector.
# Dep.analysis has then just to parse <dotaccessor> and <identifier> nodes.
# Nope.
# I revert. I remove the <variable> nodes. Later when parsing the ast, I will
# either check for ("dotaccessor", "identifier"), or, maybe better, provide a
# Node.isVar() method that returns true for those two node types.

@method(symbol("."))
def ifix(self, left):
    if token.id != "identifier":
        raise SyntaxException("Expected an attribute name (pos %r)." % ((token.get("line"), token.get("column")),))
    accessor = symbol("dotaccessor")(token.get("line"), token.get("column"))
    accessor.childappend(left)
    accessor.childappend(expression(symbol(".").bind_left)) 
        # i'm providing the rbp to expression() here explicitly, so "foo.bar(baz)" gets parsed
        # as (call (dotaccessor ...) (param baz)), and not (dotaccessor foo
        # (call bar (param baz))).
    return accessor


symbol("dotaccessor")

@method(symbol("dotaccessor"))
def toJS(self, opts):
    r = self.children[0].toJS(opts)
    r += '.'
    r += self.children[1].toJS(opts)
    return r

@method(symbol("dotaccessor"))
def toListG(self):
    for e in itert.chain(self.children[0].toListG(), [self], self.children[1].toListG()):
        yield e

##
# walk down to find the "left-most" identifier ('a' in 'a.b().c')
@method(symbol("dotaccessor"))
def getLeftmostOperand(self):
    ident = self.children[0]
    while ident.type not in ("identifier", "constant"):  # e.g. 'dotaccessor', 'first', 'call', 'accessor', ...
        ident =ident.children[0]
    return ident

##
# walk down to find the "right-most" identifier ('c' in a.b.c)
@method(symbol("dotaccessor"))
def getRightmostOperand(self):
    ident = self.children[1]
    return ident # "left-leaning" syntax tree (. (. a b) c)

# constants

def constant(id_):
    @method(symbol(id_))
    def pfix(self):
        self.id = "constant"
        self.value = id_
        return self
    symbol(id_).toListG = toListG_self_first

constant("null")
constant("true")
constant("false")

# bracket expressions

symbol("("), symbol(")"), symbol("arguments")

@method(symbol("("))  # <call>
def ifix(self, left):
    call = symbol("call")(token.get("line"), token.get("column"))
    # operand
    operand = symbol("operand")(token.get("line"), token.get("column"))
    call.childappend(operand)
    operand.childappend(left)
    # params - parse as group
    params = symbol("arguments")(token.get("line"), token.get("column"))
    call.childappend(params)
    group = self.pfix()
    for c in group.children:
        params.childappend(c)
    return call

symbol("operand")

@method(symbol("operand"))
def toJS(self, opts):
    return self.children[0].toJS(opts)

@method(symbol("operand"))
def toListG(self):
    for e in self.children[0].toListG():
        yield e


@method(symbol("("))  # <group>
def pfix(self):
    # There is sometimes a one-to-one replacement of the symbol instance from
    # <token> and a different symbol created in the parsing method (here
    # "symbol-(" vs. "symbol-group"). But there are a lot of attributes you want to
    # retain from the token, like "line", "column", .comments, and maybe others.
    # The reason for not retaining the token itself is that the replacement is
    # more specific (as here "(" which could be "group", "call" etc.). Just
    # re-writing .type would be enough for most tree traversing routines. But
    # the parsing methods themselves are class-based.
    group = symbol("group")()
    self.patch(group) # for "line", "column", .comments, etc.
    if token.id != ")":
        while True:
            if token.id == ")":
                break
            #group.childappend(expression())  # future:
            group.childappend(expression(symbol(",").bind_left +1))
            if token.id != ",":
                break
            advance(",")
    #if not group.children:  # bug#7079
    #    raiseSyntaxException("Empty expressions in groups are not allowed", token)
    advance(")")
    return group

@method(symbol("group"))
def toJS(self, opts):
    r = []
    r.append('(')
    a = []
    for c in self.children:
        a.append(c.toJS(opts))
    r.append(','.join(a))
    r.append(')')
    return ''.join(r)

@method(symbol("group"))
def toListG(self):
    for e in itert.chain([self], [c.toListG() for c in self.children]):
        yield e


symbol("]")

@method(symbol("["))             # "foo[0]", "foo[bar]", "foo['baz']"
def ifix(self, left):
    accessor = symbol("accessor")()
    self.patch(accessor)
    # identifier
    accessor.childappend(left)
    # selector
    key = symbol("key")(token.get("line"), token.get("column"))
    accessor.childappend(key)
    key.childappend(expression())
    # assert token.id == ']'
    affix_comments(key.commentsAfter, token)
    advance("]")
    return accessor

@method(symbol("["))             # arrays, "[1, 2, 3]"
def pfix(self):
    arr = symbol("array")()
    self.patch(arr)
    is_after_comma = 0
    while True:
        if token.id == "]":
            if is_after_comma:  # preserve dangling comma (bug#6210)
                arr.childappend(symbol("(empty)")())
            if arr.children:
                affix_comments(arr.children[-1].commentsAfter, token)
            else:
                affix_comments(arr.commentsIn, token)
            break
        elif token.id == ",":  # elision
            arr.childappend(symbol("(empty)")())
        else:
            #arr.childappend(expression())  # future: 
            arr.childappend(expression(symbol(",").bind_left +1))
        if token.id != ",":
            break
        else:
            is_after_comma = 1
            advance(",")
    advance("]")
    return arr

symbol("accessor")

@method(symbol("accessor"))
def toJS(self, opts):
    r = u''
    r += self.children[0].toJS(opts)
    r += '['
    r += self.children[1].toJS(opts)
    r += ']'
    return r

@method(symbol("accessor"))
def toListG(self):
    for e in itert.chain(self.children[0].toListG(), [self], self.children[1].toListG()):
        yield e


symbol("array")

@method(symbol("array"))
def toJS(self, opts):
    r = []
    for c in self.children:
        r.append(c.toJS(opts))
    return '[' + u','.join(r) + ']'

symbol("array").toListG = toListG_self_first


symbol("key")

@method(symbol("key"))
def toJS(self, opts):
    return self.children[0].toJS(opts)

@method(symbol("key"))
def toListG(self):
    for e in self.children[0].toListG():
        yield e


symbol("}")

@method(symbol("{"))                    # object literals
def pfix(self):
    mmap = symbol("map")()
    self.patch(mmap)
    if token.id != "}":
        is_after_comma = 0
        while True:
            if token.id == "}":
                if is_after_comma:  # prevent dangling comma '...,}' (bug#6210)
                    raise SyntaxException("Illegal dangling comma in map (pos %r)" % ((token.get("line"),token.get("column")),))
                break
            is_after_comma = 0
            map_item = symbol("keyvalue")(token.get("line"), token.get("column"))
            mmap.childappend(map_item)
            # key
            keyname = token
            assert (keyname.type=='identifier' or
                (keyname.type=='constant' and keyname.get('constantType','') in ('number','string'))
                ), "Illegal map key: %s" % keyname.get('value')
            advance()
            # the <keyname> node is not entered into the ast, but resolved into <keyvalue>
            map_item.set("key", keyname.get("value"))
            quote_type = keyname.get("detail", False)
            map_item.set("quote", quote_type if quote_type else '')
            map_item.comments = keyname.comments
            advance(":")
            # value
            #keyval = expression()  # future: 
            keyval = expression(symbol(",").bind_left +1)
            val = symbol("value")(token.get("line"), token.get("column"))
            val.childappend(keyval)
            map_item.childappend(val)  # <value> is a child of <keyvalue>
            if token.id != ",":
                break
            else:
                is_after_comma = 1
                advance(",")
    advance("}")
    return mmap

@method(symbol("{"))                    # blocks
def std(self):
    a = statements()
    advance("}")
    return a

symbol("map")

@method(symbol("map"))
def toJS(self, opts):
    r = u''
    r += self.write("{")
    a = []
    for c in self.children:
        a.append(c.toJS(opts))
    r += ','.join(a)
    r += self.write("}")
    return r

@method(symbol("map"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

@method(symbol("value"))
def toJS(self, opts):
    return self.children[0].toJS(opts)

@method(symbol("value"))
def toListG(self):
    for e in self.children[0].toListG():
        yield e

symbol("keyvalue")

@method(symbol("keyvalue"))
def toJS(self, opts):
    key = self.get("key")
    key_quote = self.get("quote", '')
    if key_quote:
        quote = '"' if key_quote == 'doublequotes' else "'"
    elif ( key in lang.RESERVED 
           or not identifier_regex.match(key)
           # TODO: or not lang.NUMBER_REGEXP.match(key)
         ):
        print "Warning: Auto protect key: %r" % key
        quote = '"'
    else:
        quote = ''
    value = self.getChild("value").toJS(opts)
    return quote + key + quote + ':' + value

@method(symbol("keyvalue"))
def toListG(self):
    for e in itert.chain([self], self.children[0].toListG()):
        yield e


##
# The next is a shallow wrapper around "{".std, to have a more explicit rule to
# call for constructs that have blocks, like "for", "while", etc.

def block():
    t = token
    advance("{")
    s = symbol("block")()
    t.patch(s)
    s.childappend(t.std())  # the "{".std takes care of closing "}"
    return s

symbol("block")

@method(symbol("block"))
def toJS(self, opts):
    r = []
    r.append('{')
    r.append(self.children[0].toJS(opts))
    r.append('}')
    return u''.join(r)

@method(symbol("block"))
def toListG(self):
    for e in itert.chain([self], self.children[0].toListG()):
        yield e

symbol("function")

@method(symbol("function"))
def pfix(self):
    # optional name
    opt_name = None
    if token.id == "identifier":
        #self.childappend(token.get("value"))
        #self.childappend(token)
        #self.set("name", token.get("value"))
        opt_name = token
        advance()
    # params
    assert token.id == "(", "Function definition requires parameter list"
    params = symbol("params")()
    token.patch(params)
    self.childappend(params)
    group = expression()  # group parsing as helper
    for c in group.children:
        params.childappend(c)
    #params.children = group.children retains group as parent!
    # body
    body = symbol("body")()
    token.patch(body)
    self.childappend(body)
    if token.id == "{":
        body.childappend(block())
    else:
        body.childappend(statement())
    # add optional name as last child
    if opt_name:
        self.childappend(opt_name)
    return self

@method(symbol("function"))
def toJS(self, opts):
    r = self.write("function")
    if self.getChild("identifier",0):
        functionName = self.getChild("identifier",0).get("value")
        r += self.space(result=r)
        r += self.write(functionName)
    # params
    r += self.getChild("params").toJS(opts)
    # body
    r += self.getChild("body").toJS(opts)
    return r

@method(symbol("function"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

def toJS(self, opts):
    r = []
    r.append('(')
    a = []
    for c in self.children:
        a.append(c.toJS(opts))
    r.append(u','.join(a))
    r.append(')')
    return u''.join(r)

symbol("params").toJS = toJS
symbol("arguments").toJS = toJS  # same here

symbol("params").toListG = toListG_self_first
symbol("arguments").toListG = toListG_self_first

@method(symbol("body"))
def toJS(self, opts):
    r = []
    r.append(self.children[0].toJS(opts))
    # 'if', 'while', etc. can have single-statement bodies
    if self.children[0].id != 'block' and not r[-1].endswith(';'):
        r.append(';')
    return u''.join(r)

@method(symbol("body"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


# -- statements ------------------------------------------------------------

symbol("var")

@method(symbol("var"))
def pfix(self):
    while True:
        defn = symbol("definition")(token.get("line"), token.get("column"))
        self.childappend(defn)
        n = token
        if n.id != "identifier":
            raise SyntaxException("Expected a new variable name (pos %r)" % ((token.get("line"), token.get("column")),))
        advance()
        # initialization
        if token.id == "=":
            t = token
            advance()
            elem = t.ifix(n)
        # plain identifier
        else:
            elem = n
        defn.childappend(elem)
        if token.id != ",":
            break
        else:
            advance(",")
    return self

@method(symbol("var"))
def toJS(self, opts):
    r = []
    r.append("var")
    r.append(self.space())
    a = []
    for c in self.children:
        a.append(c.toJS(opts))
    r.append(','.join(a))
    return ''.join(r)

@method(symbol("var"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

@method(symbol("definition"))
def toJS(self, opts):
    return self.children[0].toJS(opts)

@method(symbol("definition"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

##
# returns the identifier node of the defined symbol
#
@method(symbol("definition"))
def getDefinee(self):
    dfn = self.children[0]  # (definition (identifier a)) or (definition (assignment (identifier a)(const 3)))
    if dfn.type == "identifier":
        return dfn
    elif dfn.type == "assignment":
        return dfn.children[0]
    else:
        raise SyntaxTreeError("Child of a 'definition' symbol must be in ('identifier', 'assignment')")

##
# returns the initialization of the defined symbol, if any
#
@method(symbol("definition"))
def getInitialization(self):
    dfn = self.children[0]
    if dfn.type == "assignment":
        return dfn.children[1]
    else:
        return None

symbol("for"); symbol("in")

@method(symbol("for"))
def std(self):
    self.type = "loop" # compat with Node.type
    self.set("loopType", "FOR")
    
    # condition
    advance("(")
    # try to consume the first part of a (pot. longer) condition
    if token.id != ";":
        chunk = expression()
    else:
        chunk = None

    # for (in)
    if chunk and chunk.id == 'in':
        self.set("forVariant", "in")
        self.childappend(chunk)

    # for (;;) [mind: all three subexpressions are optional]
    else:
        self.set("forVariant", "iter")
        condition = symbol("expressionList")(token.get("line"), token.get("column")) # TODO: expressionList is bogus here
        self.childappend(condition)
        # init part
        first = symbol("first")(token.get("line"), token.get("column"))
        condition.childappend(first)
        if chunk is None:       # empty init expr
            pass
        else: # at least one init expr
            exprList = symbol("expressionList")(token.get("line"), token.get("column"))
            first.childappend(exprList)
            exprList.childappend(chunk)
            if token.id == ',':
                advance(',')
                lst = init_list()
                for assgn in lst:
                    exprList.childappend(assgn)
        #elif token.id == ';':   # single init expr
        #    first.childappend(chunk)
        #elif token.id == ',':   # multiple init expr
        #    advance()
        #    exprList = symbol("expressionList")(token.get("line"), token.get("column"))
        #    first.childappend(exprList)
        #    exprList.childappend(chunk)
        #    lst = init_list()
        #    for assgn in lst:
        #        exprList.childappend(assgn)
        advance(";")
        # condition part 
        second = symbol("second")(token.get("line"), token.get("column"))
        condition.childappend(second)
        if token.id != ";":
            exprList = symbol("expressionList")(token.get("line"), token.get("column"))
            second.childappend(exprList)
            while token.id != ';':
                expr = expression(0)
                exprList.childappend(expr)
                if token.id == ',':
                    advance(',')
        advance(";")
        # update part
        third = symbol("third")(token.get("line"), token.get("column"))
        condition.childappend(third)
        if token.id != ")":
            exprList = symbol("expressionList")(token.get("line"), token.get("column"))
            third.childappend(exprList)
            while token.id != ')':
                expr = expression(0)
                exprList.childappend(expr)
                if token.id == ',':
                    advance(',')

    # body
    advance(")")
    body = symbol("body")(token.get("line"), token.get("column"))
    body.childappend(statementOrBlock())
    self.childappend(body)
    return self

@method(symbol("for"))
def toJS(self, opts):
    r = []
    r.append('for')
    r.append(self.space(False,result=r))
    # cond
    r.append('(')
    # for (in)
    if self.get("forVariant") == "in":
        r.append(self.children[0].toJS(opts))
    # for (;;)
    else:
        r.append(self.children[0].getChild("first").toJS(opts))
        r.append(';')
        r.append(self.children[0].getChild("second").toJS(opts))
        r.append(';')
        r.append(self.children[0].getChild("third").toJS(opts))
    r.append(')')
    # body
    r.append(self.getChild("body").toJS(opts))
    return u''.join(r)

@method(symbol("for"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

@method(symbol("in"))  # of 'for (in)'
def toJS(self, opts):
    r = u''
    r += self.children[0].toJS(opts)
    r += self.space()
    r += 'in'
    r += self.space()
    r += self.children[1].toJS(opts)
    return r

@method(symbol("in"))
def toListG(self):
    for e in itert.chain(self.children[0].toListG(), [self], self.children[1].toListG()):
        yield e


@method(symbol("expressionList"))
def toJS(self, opts):  # WARN: this conflicts (and is overwritten) in for(;;).toJS
    r = []
    for c in self.children:
        r.append(c.toJS(opts))
    return ','.join(r)

@method(symbol("expressionList"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


symbol("while")

@method(symbol("while"))
def std(self):
    self.type = "loop" # compat with Node.type
    self.set("loopType", "WHILE")
    t = advance("(")
    group = t.pfix()  # group parsing eats ")"
    exprList = symbol("expressionList")(t.get("line"),t.get("column"))
    self.childappend(exprList)
    for c in group.children:
        exprList.childappend(c)
    body = symbol("body")(token.get("line"), token.get("column"))
    body.childappend(statementOrBlock())
    self.childappend(body)
    return self

@method(symbol("while"))
def toJS(self, opts):
    r = u''
    r += self.write("while")
    r += self.space(False,result=r)
    # cond
    r += '('
    r += self.children[0].toJS(opts)
    r += ')'
    # body
    r += self.children[1].toJS(opts)
    return r

@method(symbol("while"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

symbol("do")

@method(symbol("do"))
def std(self):
    self.type = "loop" # compat with Node.type
    self.set("loopType", "DO")
    body = symbol("body")(token.get("line"), token.get("column"))
    body.childappend(statementOrBlock())
    self.childappend(body)
    advance("while")
    advance("(")
    self.childappend(expression(0))
    advance(")")
    return self

@method(symbol("do"))
def toJS(self, opts):
    r = []
    r.append("do")
    r.append(self.space())
    r.append(self.children[0].toJS(opts))
    r.append('while')
    r.append('(')
    r.append(self.children[1].toJS(opts))
    r.append(')')
    return ''.join(r)

@method(symbol("do"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


symbol("with")

@method(symbol("with"))
def std(self):
    self.type = "loop" # compat. with Node.type
    self.set("loopType", "WITH")
    advance("(")
    self.childappend(expression(0))
    advance(")")
    body = symbol("body")(token.get("line"), token.get("column"))
    body.childappend(statementOrBlock())
    self.childappend(body)
    return self

# the next one - like with other loop types - is *used*, as dispatch is by class, 
# not obj.type (cf. "loop".toJS(opts))
@method(symbol("with"))
def toJS(self, opts):
    r = []
    r += ["with"]
    r += ["("]
    r += [self.children[0].toJS(opts)]
    r += [")"]
    r += [self.children[1].toJS(opts)]
    return u''.join(r)

@method(symbol("with"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

// while
symbol("while").pfix = function () {
  token = next();
  assert(token.source=='while');
  advance('(');
  condition = token.pfix()
  body = token.pfix()
  this.addChild(condition, body);
  return this;
};

symbol("while").toJS = function () {
    var r = [
      'while'
      ,'('
      ,this.children[0].toJS()
      ,')'
      ,this.children[1].toJS()
      ].join('');
    return r;
}

// if - else
symbol("if").std = function () {
    this.set('loopType', 'IF');
    advance('(');
    this.childappend(expression(0));
    advance(')');
    then_part = symbol('body');
    then_part.childappend(statementOrBlock());
    this.childappend(then_part);
    if (token.type == 'else') {
       advance('else');
       else_part = symbol('body');
       else_part.childappend(statementOrBlock());
       this.childappend(else_part);
    }
    return this;
}

def toJS(self, opts):
    r = u''
    # Additional new line before each loop
    if not self.isFirstChild(True) and not self.getChild("commentsBefore", False):
        prev = self.getPreviousSibling(False, True)

        # No separation after case statements
        #if prev != None and prev.type in ["case", "default"]:
        #    pass
        #elif self.hasChild("elseStatement") or self.getChild("statement").hasBlockChildren():
        #    self.sep()
        #else:
        #    self.line()
    r += self.write("if")
    # condition
    r += self.write("(")
    r += self.children[0].toJS(opts)
    r += self.write(")")
    # 'then' part
    r += self.children[1].toJS(opts)
    # (opt) 'else' part
    if len(self.children) == 3:
        r += self.write("else")
        r += self.space()
        r += self.children[2].toJS(opts)
    r += self.space(False,result=r)
    return r

@method(symbol("if"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e

symbol("loop")

##
# TODO: Is this code used?!
@method(symbol("loop"))
def toJS(self, opts):
    r = u''
    # Additional new line before each loop
    if not self.isFirstChild(True) and not self.getChild("commentsBefore", False):
        prev = self.getPreviousSibling(False, True)

        # No separation after case statements
        if prev != None and prev.type in ["case", "default"]:
            pass
        elif self.hasChild("elseStatement") or self.getChild("statement").hasBlockChildren():
            self.sep()
        else:
            self.line()

    loopType = self.get("loopType")

    if loopType == "IF":
        pass

    elif loopType == "WHILE":
        r += self.write("while")
        r += self.space(False,result=r)

    elif loopType == "FOR":
        r += self.write("for")
        r += self.space(False,result=r)

    elif loopType == "DO":
        r += self.write("do")
        r += self.space(False,result=r)

    elif loopType == "WITH":
        r += self.write("with")
        r += self.space(False,result=r)

    else:
        print "Warning: Unknown loop type: %s" % loopType
    return r


symbol("break")

@method(symbol("break"))
def std(self):
    #if token.id not in StmntTerminatorTokens:
    if not expressionTerminated():
        self.childappend(expression(0))   # this is over-generating! (should be 'label')
    #advance(";")
    return self

@method(symbol("break"))
def toJS(self, opts):
    r = self.write("break")
    if self.children:
        r += self.space(result=r)
        r += self.write(self.children[0].toJS(opts))
    return r

@method(symbol("break"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


symbol("continue")

@method(symbol("continue"))
def std(self):
    #if token.id not in StmntTerminatorTokens:
    if not expressionTerminated():
        self.childappend(expression(0))   # this is over-generating! (should be 'label')
    #advance(";")
    return self

@method(symbol("continue"))
def toJS(self, opts):
    r = self.write("continue")
    if self.children:
        r += self.space(result=r)
        r += self.write(self.children[0].toJS(opts))
    return r

@method(symbol("continue"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


symbol("return")

@method(symbol("return"))
def std(self):
    #if token.id not in StmntTerminatorTokens:
    if not expressionTerminated():
        self.childappend(expression(0))
    return self

@method(symbol("return"))
def toJS(self, opts):
    r = ["return"]
    if self.children:
        r.append(self.space())
        r.append(self.children[0].toJS(opts))
    return ''.join(r)

@method(symbol("return"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


@method(symbol("new"))  # need to treat 'new' explicitly, for the awkward 'new Foo()' "call" syntax
def pfix(self):
    arg = expression(self.bind_left-1)  # first, parse a normal expression (this excludes '()')
    if token.id == '(':  # if the next token indicates a call
        t = token
        advance("(")
        arg = t.ifix(left=arg)   # invoke '('.ifix, with class name as <left> arg
    self.childappend(arg)
    return self

symbol("new").toListG = toListG_self_first


symbol("switch"); symbol("case"); symbol("default")

@method(symbol("switch"))
def std(self):
    advance("(")
    self.childappend(expression(0))
    advance(")")
    advance("{")
    body = symbol("body")(token.get("line"), token.get("column"))
    self.childappend(body)
    while True:
        if token.id == "}": break
        elif token.id == "case":
            case = token  # make 'case' the root node (instead e.g. ':')
            advance("case")
            case.childappend(expression(symbol(":").bind_left +1))
            advance(":")
            if token.id in ("case", "default") : # fall-through
                pass
            else:
                case.childappend(case_block())
        elif token.id == "default":
            case = token
            advance("default")
            advance(":")
            if token.id in ("case",) : # fall-through
                pass
            else:
                case.childappend(case_block())
        body.childappend(case)
    advance("}")
    return self

def case_block():
    # we assume here that there is at least one statement to parse
    s = symbol("statements")(token.get("line"), token.get("column"))
    while True:
        if token.id in ("case", "default", "}"):
            break
        s.childappend(statement())
    return s


@method(symbol("switch"))
def toJS(self, opts):
    r = []
    r.append("switch")
    # control
    r.append('(')
    r.append(self.children[0].toJS(opts))
    r.append(')')
    # body
    r.append('{')
    body = self.getChild("body")
    for c in body.children:
        r.append(c.toJS(opts))
    r.append('}')
    return ''.join(r)

@method(symbol("switch"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


@method(symbol("case"))
def toJS(self, opts):
    r = []
    r.append('case')
    r.append(self.space())
    r.append(self.children[0].toJS(opts))
    r.append(':')
    if len(self.children) > 1:
        r.append(self.children[1].toJS(opts))
    return ''.join(r)

@method(symbol("case"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


@method(symbol("default"))
def toJS(self, opts):
    r = []
    r.append('default')
    r.append(':')
    if len(self.children) > 0:
        r.append(self.children[0].toJS(opts))
    return ''.join(r)

@method(symbol("default"))
def toListG(self):
    for e in itert.chain([self], *[c.toListG() for c in self.children]):
        yield e


symbol("try"); symbol("catch"); symbol("finally")

@method(symbol("try"))
def std(self):
    self.childappend(block())
    if token.id == "catch":
        catch = token
        self.childappend(catch)
        advance("catch")
        #advance("(")
        #catch.childappend(expression(0))
        #advance(")")

        # insert "params" node, par. to function.pfix
        assert token.id == "("
        params = symbol("params")(token.get("line"), token.get("column"))
        catch.childappend(params)
        group = expression()  # group parsing as helper
        for c in group.children:
            params.childappend(c)  # to have params as parent of group's children

        catch.childappend(block())
    if token.id == "finally":
        finally_ = token
        advance("finally")
        self.childappend(finally_)
        finally_.childappend(block())
    return self

@method(symbol("try"))
def toJS(self, opts):
    r = []
    r.append('try')
    r.append(self.children[0].toJS(opts))
    catch = self.getChild("catch", 0)
    if catch:
        r.append('catch')
        #r.append('(')
        r.append(catch.children[0].toJS(opts))
        #r.append(')')
        r.append(catch.children[1].toJS(opts))
    finally_ = self.getChild("finally", 0)
    if finally_:
        r.append('finally')
        r.append(finally_.children[0].toJS(opts))
    return ''.join(r)

symbol("try").toListG = toListG_self_first
symbol("catch").toListG = toListG_self_first
symbol("finally").toListG = toListG_self_first


symbol("throw")

@method(symbol("throw"))
def std(self):
    if token.id not in ("eol",  ";"):
        self.childappend(expression(0))
    #advance(";")
    return self

@method(symbol("throw"))
def toJS(self, opts):
    r = u''
    r += 'throw'
    r += self.space()
    r += self.children[0].toJS(opts)
    return r

symbol("throw").toListG = toListG_self_first

def expression(bind_right=0):
    global token
    t = token
    token = next()
    left = t.pfix()
    while token.bind_left > bind_right:
        t = token
        token = next()
        left = t.ifix(left)
    return left


symbol("label")

def statement():
    # labeled statement
    if token.type == "identifier" and tokenStream.peek(1).id == ":": # label
        s = symbol("label")(token.get("line"), token.get("column"))
        s.attributes = token.attributes
        advance()
        advance(":")
        s.childappend(statement())
    # normal SourceElement
    else:
        n = token
        s = None 
        # function declaration, doesn't need statementEnd
        if token.id == 'function' and tokenStream.peek(1).type == 'identifier':
            advance()
            s = n.pfix()
            if token.id == ';':  # consume dangling semi
                advance()
        # statement
        else:
            if getattr(token, 'std', None):
                advance()
                s = n.std()
            elif token.id == ';': # empty statement
                s = symbol("(empty)")()
            elif token.type != 'eol': # it's not an empty line
                s = expression()
                # Crockford's too tight here
                #if not (s.id == "=" or s.id == "("):
                #    raise SyntaxException("Bad expression statement (pos %r)" % ((token.get("line"), token.get("column")),))

                # handle expression lists
                # (REFAC: somewhat ugly here, expression lists should be treated generically,
                # but there is this conflict between ',' as an operator infix(",", 5)
                # and a stock symbol(",", 0) that terminates every expression() parse, like for
                # arrays, maps, etc.).
                if token.id == ',':
                    s1 = symbol("expressionList")(token.get("line"), token.get("column"))
                    s1.childappend(s)
                    s = s1
                    while token.id == ',':
                        advance(',')
                        s.childappend(expression())
            statementEnd()
    return s

@method(symbol("statement"))
def toJS(self, opts):
    return self.children[0].toJS(opts)

symbol("statement").toListG = toListG_just_children

@method(symbol("(empty)"))
def toJS(self, opts):
    return u''

symbol("(empty)").toListG = toListG_self_first

@method(symbol("label"))
def toJS(self, opts):
    r = []
    r += [self.get("value")]  # identifier
    r += [":"]
    r += [self.children[0].toJS(opts)]
    return ''.join(r)

symbol("label").toListG = toListG_self_first


def statementEnd():
    if token.id in (";",):
        advance()
    #elif token.id == "eof":
    #    return token  # ok as stmt end, but don't just skip it (bc. comments)
    elif tokenStream.eolBefore:
        pass # that's ok as statement end
    #if token.id in ("eof", 
    #    "eol", # these are not yielded by the TokenStream currently
    #    ";", 
    #    "}"  # it's the last statement in a block
    #    ):
    #    advance()
    #else:
    #    ltok = tokenStream.lookbehind()
    #    if ltok.id == '}':  # it's a statement ending with a block ('if' etc.)
    #        pass
    #    else:
    #        raise SyntaxException("Unterminated statement (pos %r)" % ((token.get("line"), token.get("column")),))


@method(symbol("eof"))
def toJS(self, opts):
    return u''

symbol("eof").toListG = toListG_self_first

def statementOrBlock(): # for 'if', 'while', etc. bodies
    if token.id == '{':
        return block()
    else:
        return statement()

def statements():  # plural!
    s = symbol("statements")(token.get("line"), token.get("column"))
    while True:
        if token.id == "}" or token.id == "eof":
            if token.id == "eof" and token.comments:
                s.childappend(token)  # keep eof for pot. comments
            break
        st = statement()
        if st:
            #stmt = symbol("statement")(st.get("line"), st.get("column")) # insert <statement> for better finding comments later
            #stmt.childappend(st)
            s.childappend(st)
    return s


@method(symbol("statements"))
def toJS(self, opts):
    r = []
    for cld in self.children:
        c = cld.toJS(opts)
        r.append(c)
        if not c or c[-1] != ';':
            r.append(';')
    return u''.join(r)

symbol("statements").toListG = toListG_just_children


def init_list():  # parse anything from "i" to "i, j=3, k,..."
    lst = []
    while True:
        if token.id != "identifier":
            break
        elem = expression()
        lst.append(elem)
        if token.id != ",":
            break
        else:
            advance(",")
    return lst

# next is not used!
def argument_list(list):
    while 1:
        if token.id != "identifier":
            raise SyntaxException("Expected an argument name (pos %r)." % ((token.get("line"), token.get("column")),))
        list.append(token)
        advance()
        if token.id == "=":
            advance()
            list.append(expression())
        else:
            list.append(None)
        if token.id != ",":
            break
        advance(",")


