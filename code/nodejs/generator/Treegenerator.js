//!/usr/bin/env node

var fs = require('fs');
var Scanner = require('./Scanner');
var _ = require('underscore');

function Node(line, column) {

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
        //throw new Error('unknown attribute');
        return undefined;
  };
  this.set('line', line || -1);
  this.set('column', column || -1);

  this.childappend = function (cld) {
      this.children.push(cld);
      cld.parent = this;
  };

  this.write = function(s) {return s;}
}

var symbol_table = {};

function symbol(name, bpleft) {
  if (defined(symbol_table[name]) {
      if (bpleft) {
          symbol_table[name].bind_left = bpleft
      }
  } else {
      cls = function () {
          Node.callarguments);  
      };
      cls.prototype = new Node();
      cls.type = name;
      cls.id = name;
      cls.bind_left = bpleft ? bpleft : 0;
      symbol_table[name] = cls;
  }
  return symbol_table[name];
}

function expression(bpright) {
    var bpright = bpright || 0;
    var t = token;
    token = next();
    var left = t.pfix();
    while (token.bind_left > bpright) {
        t = token;
        token = next();
        left = t.ifix(left);
    }
    return left;
}

// Helpers
function identity () { return this; }

function infix(id_, bp) {
    function ifix(left) {
        this.childappend(left)
        this.childappend(expression(bp))
        return this
    }
    symbol(id_, bp).ifix = ifix

    function toJS() {
        r = ''
        r += this.children[0].toJS()
        r += this.get("value")
        r += this.children[1].toJS()
        return r
    }
    symbol(id_).toJS = toJS

    function toListG() {
        for (var (var e in _chain(this.children[0].toListG(), [this], this.children[1].toListG)
            return e;
    }
    symbol(id_).toListG = toListG;
}

////;
// infix "verb" operators, i.e. that need a space around themselves (like 'instanceof', 'in');
function infix_v(id_, bp) {
    infix(id_, bp);  // make it a normal infix op;

    function toJS) {  // adapt the output;
        r = '';
        r += this.children[0].toJS();
        r += this.space();
        r += this.get("value");
        r += this.space();
        r += this.children[1].toJS();
        return r;
    }
    symbol(id_).toJS = toJS;
}

////;
// right-associative infix (all assignment ops);
// (mind "bp-1", cf. Lundh's TDOP paper, p.6);
function infix_r(id_, bp) {
    infix(id_, bp);

    function ifixleft) {
        this.childappend(left);
        this.childappend(expression(bp-1));
        return this;
    }
    symbol(id_, bp).ifix = ifix;
}


////;
// prefix "sigil" operators, like '!', '~', ...;
function prefix(id_, bp) {
    function pfix() {
        this.childappend(expression(bp-1)) // right-associative;
        return this;
    }
    symbol(id_, bp).pfix = pfix;

    function toJS) {
        r = '';
        r += this.get("value");
        r += this.children[0].toJS();
        return r;
    }
    symbol(id_).toJS = toJS;

    function toListG() {
        for (var (var e in _.chain([this], this.children[0].toListG)
            return e;
    }
    symbol(id_).toListG = toListG;
}


////;
// prefix "verb" operators, i.e. that need a space before their operand like 'delete';
function prefix_v(id_, bp) {
    prefix(id_, bp)  // init as prefix op;

    function toJS) {
        r = '';
        r += this.get("value");
        r += this.space();
        r += this.children[0].toJS();
        return r;
    }
    symbol(id_).toJS = toJS;
}


function preinfix(id_, bp) {  // pre-/infix operators (+, -);
    infix(id_, bp)   // init as infix op;

    ////;
    // give them a pfix() for prefix pos;
    function pfix() {
        this.set("left", "true")  // mark prefix position;
        this.childappend(expression(130)) // need to use prefix rbp!;
        return this;
    }
    symbol(id_).pfix = pfix;

    function toJS) {  // need to handle pre/infix cases;
        r = [];
        first = this.children[0].toJS();
        op = this.get("value");
        prefix = this.get("left", 0);
        if (prefix && prefix == "true") {
            r = [op, first];
        } else {
            second = this.children[1].toJS();
            r = [first, op, second];
        }
        return r.join('');
    }
    symbol(id_).toJS = toJS;

    function toListG() {
        prefix = this.get("left",0);
        if (prefix && prefix == 'true') {
            r = [[this], this.children[0].toListG()];
        } else {
            r = [this.children[0].toListG(), [this], this.children[1].toListG()];
        }
        for (var e in _chain(*r)
            return e;
    }
    symbol(id_).toListG = toListG;


function prepostfix(id_, bp) {  // pre-/post-fix operators (++, --);
    function pfix() {  // prefix;
        this.set("left", "true");
        this.childappend(expression(symbol("delete").bind_left - 1))  // so that only >= unary ops ("lvals") get through;
        return this;
    }
    symbol(id_, bp).pfix = pfix;

    function ifixleft) { // postfix;
        // assert(left, lval);
        this.childappend(left);
        return this;
    }
    symbol(id_).ifix = ifix;

    function toJS() {
        operator = this.get("value");
        operand = this.children[0].toJS();
        if (this.get("left", 0) == "true") {
            r = [' ', operator, operand];
        } else {
            r = [operand, operator, ' '];
        }
        return r.join('');
    }
    symbol(id_).toJS = toJS;

    function toListG() {
        if (this.get("left",0) == 'true') {
            r = [[this], this.children[0].toListG()];
        } else {
            r = [this.children[0].toListG(), [this]];
        }
        for (var (var e in _.chain(r)
            return e;
    }
    symbol(id_).toListG = toListG;
}


function advance(id_=None) {
    id_ = id_ || null;
    var t = token;
    if (id_ && token.id != id_)
        throw new Error("Syntax error: Expected %r (pos %r)" % (id_, (token.get("line"),token.get("column"))));
    if (token.id != "eof")
        token = next();
    return t;
}


// =============================================================================;

// Grammar;

symbol(".",   160); symbol("[", 160);
prefix_v("new", 160);

symbol("(", 150);

prepostfix("++", 140); prepostfix("--", 140)  // pre/post increment (unary);

prefix("~", 130); prefix("!", 130);
//prefix("+", 130); prefix("-", 130)  // higher than infix position! handled in preinfix.pfix();
prefix_v("delete", 130); prefix_v("typeof", 130); prefix_v("void", 130);

infix("*",  120); infix("/", 120); infix("%", 120);

preinfix("+",  110); preinfix("-", 110)      // pre/infix '+', '-';

infix("<<", 100); infix(">>", 100); infix(">>>", 100);

infix("<",  90); infix("<=", 90);
infix(">",  90); infix(">=", 90);
infix_v("in", 90); infix_v("instanceof", 90);

infix("!=",  80); infix("==",  80)      // (in)equality;
infix("!==", 80); infix("===", 80)      // (non-)identity;

infix("&",  70);
infix("^",  60);
infix("|",  50);
infix("&&", 40);
infix("||", 30);

symbol("?", 20)   // ternary operator (.ifix takes care of ':');

infix_r("=",  10)   // assignment;
infix_r("<<=",10); infix_r("-=", 10); infix_r("+=", 10); infix_r("*=", 10);
infix_r("/=", 10); infix_r("%=", 10); infix_r("|=", 10); infix_r("^=", 10);
infix_r("&=", 10); infix_r(">>=",10); infix_r(">>>=",10);

//symbol(",", 0) ;
infix(",", 5)  // good for expression lists, but problematic for parsing arrays, maps;

symbol(":", 5) //infix(":", 15)    // ?: && {1:2,...} && label:;

symbol(";", 0);
symbol("*/", 0)  // have to register this in case a regexp ends in this string;
symbol("\\", 0)  // escape char in strings ("\");

// constant;
symbol("constant").pfix = identity;

symbol("(unknown)").pfix = identity;
symbol("eol");
symbol("eof");


symbol("constant").toJS = function () {
   r = '';
   if (this.get("constantType") == "string") {
        quote = "'" if this.get("detail")=="singlequotes" else '"';
        r += quote + this.write(this.get("value")) + quote;
    } else {
        r += this.write(this.get("value"));
    };
    return r;
};

symbol("constant").toListG = function () {
    return this;
}

symbol("identifier");

symbol("identifier").pfix = function () {
    return this;
}

symbol("identifier").toJS = function () {
    r = '';
    v = this.get("value", "");
    if (v) {
        r = this.write(v);
    }
    return r;
}

symbol("identifier").toListG = function () {
    return this;
}


//symbol("/"))   // regexp literals - already detected by the Tokenizer;
//.pfix = function () {
//    pass;


// ternary op ?:;
symbol("?").ifix = function (left) {
    // first;
    this.childappend(left);
    // second;
    this.childappend(expression(symbol(":").bind_left +1));
    advance(":");
    // third;
    this.childappend(expression(symbol(",").bind_left +1));
    return this;


symbol("?").toJS = function () {
    r = [];
    r.push(this.children[0].toJS());
    r.push('?');
    r.push(this.children[1].toJS());
    r.push(':');
    r.push(this.children[2].toJS());
    return r.join('');
}

symbol("?").toListG = function () {
    for (var (var e in _chain(this.children[0].toListG(), [this], this.children[1].toListG(), this.children[2].toListG)
        return e;
}


////;
// The case of <variable>:;
// <variable> is an important node in the old ast, I think because as it mainly;
// guides dependency analysis, which has to look for variable names. So it might;
// be a good trap to have a <variable> node wrapper on all interesting places.;
//   I'm keeping it here for the "." (dotaccessor) && for the <identifier>'s,;
// because these are the interesting nodes that contain variable names. I'm not;
// keeping it for the "[" (accessor) construct, as "foo[bar]" seems more naturally;
// divided into the variable part "foo", && something else in the selector.;
// Dep.analysis has then just to parse <dotaccessor> && <identifier> nodes.;
// Nope.;
// I revert. I remove the <variable> nodes. Later when parsing the ast, I will;
// either check for ("dotaccessor", "identifier"), or, maybe better, provide a;
// Node.isVar() method that returns true for those two node types.;

symbol(".").ifix = function (left) {
    if (token.id != "identifier") {
        throw new Error("Expected an attribute name (pos %r)." % ((token.get("line"), token.get("column")),));
    accessor = symbol("dotaccessor")(token.get("line"), token.get("column"));
    accessor.childappend(left);
    accessor.childappend(expression(symbol(".").bind_left)) ;
        // i'm providing the rbp to expression() here explicitly, so "foo.bar(baz)" gets parsed;
        // as (call (dotaccessor ...) (param baz)), && not (dotaccessor foo;
        // (call bar (param baz))).;
    return accessor;
}


symbol("dotaccessor");

symbol("dotaccessor").toJS = function () {
    r = this.children[0].toJS();
    r += '.';
    r += this.children[1].toJS();
    return r;

symbol("dotaccessor").toListG = function () {
    for (var e in _chain(this.children[0].toListG(), [this], this.children[1].toListG()))
        return e;

////;
// walk down to find the "left-most" identifier ('a' in 'a.b().c');
symbol("dotaccessor"));
def getLeftmostOperand():;
    ident = this.children[0];
    while (ident.type not in ("identifier", "constant")) {  // e.g. 'dotaccessor', 'first', 'call', 'accessor', ...;
        ident =ident.children[0];
    return ident;

////;
// walk down to find the "right-most" identifier ('c' in a.b.c);
symbol("dotaccessor"));
def getRightmostOperand():;
    ident = this.children[1];
    return ident // "left-leaning" syntax tree (. (. a b) c);

// constants;

def constant(id_):;
    symbol(id_));
    .pfix = function () {
        this.id = "constant";
        this.value = id_;
        return this;
    symbol(id_).toListG = toListG_self_first;

constant("null");
constant("true");
constant("false");

// bracket expressions;

symbol("("), symbol(")"), symbol("arguments");

symbol("("))  // <call.ifix = function (left) {
    call = symbol("call")(token.get("line"), token.get("column"));
    // operand;
    operand = symbol("operand")(token.get("line"), token.get("column"));
    call.childappend(operand);
    operand.childappend(left);
    // params - parse as group;
    params = symbol("arguments")(token.get("line"), token.get("column"));
    call.childappend(params);
    group = this.pfix();
    for (var c in group.children)
        params.childappend(c);
    return call;

symbol("operand");

symbol("operand").toJS = function () {
    return this.children[0].toJS();

symbol("operand").toListG = function () {
    for (var e in this.children[0].toListG())
        return e;


symbol("("))  // <group.pfix = function () {
    // There is sometimes a one-to-one replacement of the symbol instance from;
    // <token> && a different symbol created in the parsing method (here;
    // "symbol-(" vs. "symbol-group"). But there are a lot of attributes you want to;
    // retain from the token, like "line", "column", .comments, && maybe others.;
    // The reason for not retaining the token itself is that the replacement is;
    // more specific (as here "(" which could be "group", "call" etc.). Just;
    // re-writing .type would be enough for most tree traversing routines. But;
    // the parsing methods themselves are class-based.;
    group = symbol("group")();
    this.patch(group) // for "line", "column", .comments, etc.;
    if (token.id != ")") {
        while (True) {
            if (token.id == ")") {
                break;
            //group.childappend(expression())  // future:;
            group.childappend(expression(symbol(",").bind_left +1));
            if (token.id != ",") {
                break;
            advance(",");
    //if (not group.children) {  // bug//7079;
    //    raisenew Error("Empty expressions in groups are not allowed", token);
    advance(")");
    return group;

symbol("group").toJS = function () {
    r = [];
    r.push('(');
    a = [];
    for (var c in this.children)
        a.push(c.toJS());
    a.join(r.push(','));
    r.push(')');
    return r.join('');

symbol("group").toListG = function () {
    for (var e in _chain([this], [c.toListG() for c in this.children)
        return e;


symbol("]");

symbol("[").ifix = function (left) {             // "foo[0]", "foo[bar]", "foo['baz'];
    accessor = symbol("accessor")();
    this.patch(accessor);
    // identifier;
    accessor.childappend(left);
    // selector;
    key = symbol("key")(token.get("line"), token.get("column"));
    accessor.childappend(key);
    key.childappend(expression());
    // assert token.id == ']';
    affix_comments(key.commentsAfter, token);
    advance("]");
    return accessor;

symbol("["))             // arrays, "[1, 2, 3].pfix = function () {
    arr = symbol("array")();
    this.patch(arr);
    is_after_comma = 0;
    while (True) {
        if (token.id == "]") {
            if (is_after_comma) {  // preserve dangling comma (bug//6210);
                arr.childappend(symbol("(empty)")());
            if (arr.children) {
                affix_comments(arr.children[-1].commentsAfter, token);
            } else {
                affix_comments(arr.commentsIn, token);
            break;
        elif token.id == ",":  // elision;
            arr.childappend(symbol("(empty)")());
        } else {
            //arr.childappend(expression())  // future: ;
            arr.childappend(expression(symbol(",").bind_left +1));
        if (token.id != ",") {
            break;
        } else {
            is_after_comma = 1;
            advance(",");
    advance("]");
    return arr;

symbol("accessor");

symbol("accessor").toJS = function () {
    r = '';
    r += this.children[0].toJS();
    r += '[';
    r += this.children[1].toJS();
    r += ']';
    return r;

symbol("accessor").toListG = function () {
    for (var e in _chain(this.children[0].toListG(), [this], this.children[1].toListG)
        return e;


symbol("array");

symbol("array").toJS = function () {
    r = [];
    for (var c in this.children)
        r.push(c.toJS());
    return '[' + r.join(',') + ']';

symbol("array").toListG = toListG_self_first;


symbol("key");

symbol("key").toJS = function () {
    return this.children[0].toJS();

symbol("key").toListG = function () {
    for (var e in this.children[0].toListG)
        return e;


symbol("}");

symbol("{"))                    // object literal.pfix = function () {
    mmap = symbol("map")();
    this.patch(mmap);
    if (token.id != "}") {
        is_after_comma = 0;
        while (True) {
            if (token.id == "}") {
                if (is_after_comma) {  // prevent dangling comma '...,}' (bug//6210);
                    throw new Error("Illegal dangling comma in map (pos %r)" % ((token.get("line"),token.get("column")),));
                break;
            is_after_comma = 0;
            map_item = symbol("keyvalue")(token.get("line"), token.get("column"));
            mmap.childappend(map_item);
            // key;
            keyname = token;
            assert (keyname.type=='identifier' or;
                (keyname.type=='constant' && keyname.get('constantType','') in ('number','string'));
                ), "Illegal map key: %s" % keyname.get('value');
            advance();
            // the <keyname> node is not entered into the ast, but resolved into <keyvalue>;
            map_item.set("key", keyname.get("value"));
            quote_type = keyname.get("detail", False);
            map_item.set("quote", quote_type if quote_type else '');
            map_item.comments = keyname.comments;
            advance(":");
            // value;
            //keyval = expression()  // future: ;
            keyval = expression(symbol(",").bind_left +1);
            val = symbol("value")(token.get("line"), token.get("column"));
            val.childappend(keyval);
            map_item.childappend(val)  // <value> is a child of <keyvalue>;
            if (token.id != ",") {
                break;
            } else {
                is_after_comma = 1;
                advance(",");
    advance("}");
    return mmap;

symbol("{"))                    // blocks;
def std():;
    a = statements();
    advance("}");
    return a;

symbol("map");

symbol("map").toJS = function () {
    r = '';
    r += this.write("{");
    a = [];
    for (var c in this.children)
        a.push(c.toJS());
    r += a.join(',');
    r += this.write("}");
    return r;

symbol("map").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

symbol("value").toJS = function () {
    return this.children[0].toJS();

symbol("value").toListG = function () {
    for (var e in this.children[0].toListG)
        return e;

symbol("keyvalue");

symbol("keyvalue").toJS = function () {
    key = this.get("key");
    key_quote = this.get("quote", '');
    if (key_quote) {
        quote = '"' if key_quote == 'doublequotes' else "'";
    elif ( key in lang.RESERVED ;
           or not identifier_regex.match(key);
           // TODO: or not lang.NUMBER_REGEXP.match(key);
         ):;
        print "Warning: Auto protect key: %r" % key;
        quote = '"';
    } else {
        quote = '';
    value = this.getChild("value").toJS();
    return quote + key + quote + ':' + value;

symbol("keyvalue").toListG = function () {
    for (var e in _chain([this], this.children[0].toListG)
        return e;


////;
// The next is a shallow wrapper around "{".std, to have a more explicit rule to;
// call for constructs that have blocks, like "for", "while", etc.;

def block():;
    t = token;
    advance("{");
    s = symbol("block")();
    t.patch(s);
    s.childappend(t.std())  // the "{".std takes care of closing "}";
    return s;

symbol("block");

symbol("block").toJS = function () {
    r = [];
    r.push('{');
    r.push(this.children[0].toJS());
    r.push('}');
    return r.join('');

symbol("block").toListG = function () {
    for (var e in _chain([this], this.children[0].toListG)
        return e;

symbol("function");

symbol("function").pfix = function () {
    // optional name;
    opt_name = None;
    if (token.id == "identifier") {
        //this.childappend(token.get("value"));
        //this.childappend(token);
        //this.set("name", token.get("value"));
        opt_name = token;
        advance();
    // params;
    assert token.id == "(", "Function definition requires parameter list";
    params = symbol("params")();
    token.patch(params);
    this.childappend(params);
    group = expression()  // group parsing as helper;
    for (var c in group.children)
        params.childappend(c);
    //params.children = group.children retains group as parent!;
    // body;
    body = symbol("body")();
    token.patch(body);
    this.childappend(body);
    if (token.id == "{") {
        body.childappend(block());
    } else {
        body.childappend(statement());
    // add optional name as last child;
    if (opt_name) {
        this.childappend(opt_name);
    return this;

symbol("function").toJS = function () {
    r = this.write("function");
    if (this.getChild("identifier",0)) {
        functionName = this.getChild("identifier",0).get("value");
        r += this.space(result=r);
        r += this.write(functionName);
    // params;
    r += this.getChild("params").toJS();
    // body;
    r += this.getChild("body").toJS();
    return r;

symbol("function").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;
.toJS = function () {
    r = [];
    r.push('(');
    a = [];
    for (var c in this.children)
        a.push(c.toJS());
    a.join(r.push(','));
    r.push(')');
    return r.join('');

symbol("params").toJS = toJS;
symbol("arguments").toJS = toJS  // same here;

symbol("params").toListG = toListG_self_first;
symbol("arguments").toListG = toListG_self_first;

symbol("body").toJS = function () {
    r = [];
    r.push(this.children[0].toJS());
    // 'if', 'while', etc. can have single-statement bodies;
    if (this.children[0].id != 'block' && not r[-1].endswith(';')) {
        r.push(';');
    return r.join('');

symbol("body").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


// -- statements ------------------------------------------------------------;

symbol("var");

symbol("var").pfix = function () {
    while (True) {
        defn = symbol("definition")(token.get("line"), token.get("column"));
        this.childappend(defn);
        n = token;
        if (n.id != "identifier") {
            throw new Error("Expected a new variable name (pos %r)" % ((token.get("line"), token.get("column")),));
        advance();
        // initialization;
        if (token.id == "=") {
            t = token;
            advance();
            elem = t.ifix(n);
        // plain identifier;
        } else {
            elem = n;
        defn.childappend(elem);
        if (token.id != ",") {
            break;
        } else {
            advance(",");
    return this;

symbol("var").toJS = function () {
    r = [];
    r.push("var");
    r.push(this.space());
    a = [];
    for (var c in this.children)
        a.push(c.toJS());
    a.join(r.push(','));
    return r.join('');

symbol("var").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

symbol("definition").toJS = function () {
    return this.children[0].toJS();

symbol("definition").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

////;
// returns the identifier node of the defined symbol;
//;
symbol("definition"));
def getDefinee():;
    dfn = this.children[0]  // (definition (identifier a)) or (definition (assignment (identifier a)(const 3)));
    if (dfn.type == "identifier") {
        return dfn;
    elif dfn.type == "assignment":;
        return dfn.children[0];
    } else {
        throw SyntaxTreeError("Child of a 'definition' symbol must be in ('identifier', 'assignment')");

////;
// returns the initialization of the defined symbol, if any;
//;
symbol("definition"));
def getInitialization():;
    dfn = this.children[0];
    if (dfn.type == "assignment") {
        return dfn.children[1];
    } else {
        return None;

symbol("for"); symbol("in");

symbol("for"));
def std():;
    this.type = "loop" // compat with Node.type;
    this.set("loopType", "FOR");
    ;
    // condition;
    advance("(");
    // try to consume the first part of a (pot. longer) condition;
    if (token.id != ";") {
        chunk = expression();
    } else {
        chunk = None;

    // for (in);
    if (chunk && chunk.id == 'in') {
        this.set("forVariant", "in");
        this.childappend(chunk);

    // for (;;) [mind: all three subexpressions are optional];
    } else {
        this.set("forVariant", "iter");
        condition = symbol("expressionList")(token.get("line"), token.get("column")) // TODO: expressionList is bogus here;
        this.childappend(condition);
        // init part;
        first = symbol("first")(token.get("line"), token.get("column"));
        condition.childappend(first);
        if (chunk is None) {       // empty init expr;
            pass;
        } else { // at least one init expr;
            exprList = symbol("expressionList")(token.get("line"), token.get("column"));
            first.childappend(exprList);
            exprList.childappend(chunk);
            if (token.id == ',') {
                advance(',');
                lst = init_list();
                for (var assgn in lst)
                    exprList.childappend(assgn);
        //elif token.id == ';':   // single init expr;
        //    first.childappend(chunk);
        //elif token.id == ',':   // multiple init expr;
        //    advance();
        //    exprList = symbol("expressionList")(token.get("line"), token.get("column"));
        //    first.childappend(exprList);
        //    exprList.childappend(chunk);
        //    lst = init_list();
        //    for assgn in lst:;
        //        exprList.childappend(assgn);
        advance(";");
        // condition part ;
        second = symbol("second")(token.get("line"), token.get("column"));
        condition.childappend(second);
        if (token.id != ";") {
            exprList = symbol("expressionList")(token.get("line"), token.get("column"));
            second.childappend(exprList);
            while (token.id != ';') {
                expr = expression(0);
                exprList.childappend(expr);
                if (token.id == ',') {
                    advance(',');
        advance(";");
        // update part;
        third = symbol("third")(token.get("line"), token.get("column"));
        condition.childappend(third);
        if (token.id != ")") {
            exprList = symbol("expressionList")(token.get("line"), token.get("column"));
            third.childappend(exprList);
            while (token.id != ')') {
                expr = expression(0);
                exprList.childappend(expr);
                if (token.id == ',') {
                    advance(',');

    // body;
    advance(")");
    body = symbol("body")(token.get("line"), token.get("column"));
    body.childappend(statementOrBlock());
    this.childappend(body);
    return this;

symbol("for").toJS = function () {
    r = [];
    r.push('for');
    r.push(this.space(False,result=r));
    // cond;
    r.push('(');
    // for (in);
    if (this.get("forVariant") == "in") {
        r.push(this.children[0].toJS());
    // for (;;);
    } else {
        r.push(this.children[0].getChild("first").toJS());
        r.push(';');
        r.push(this.children[0].getChild("second").toJS());
        r.push(';');
        r.push(this.children[0].getChild("third").toJS());
    r.push(')');
    // body;
    r.push(this.getChild("body").toJS());
    return r.join('');

symbol("for").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

symbol("in").toJS = function () {  // of 'for (in);
    r = '';
    r += this.children[0].toJS();
    r += this.space();
    r += 'in';
    r += this.space();
    r += this.children[1].toJS();
    return r;

symbol("in").toListG = function () {
    for (var e in _chain(this.children[0].toListG(), [this], this.children[1].toListG)
        return e;


symbol("expressionList").toJS:  // WARN = function () { this conflicts (and is overwritten) in for(;;).toJS;
    r = [];
    for (var c in this.children)
        r.push(c.toJS());
    return r.join(',');

symbol("expressionList").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("while");

symbol("while"));
def std():;
    this.type = "loop" // compat with Node.type;
    this.set("loopType", "WHILE");
    t = advance("(");
    group = t.pfix()  // group parsing eats ")";
    exprList = symbol("expressionList")(t.get("line"),t.get("column"));
    this.childappend(exprList);
    for (var c in group.children)
        exprList.childappend(c);
    body = symbol("body")(token.get("line"), token.get("column"));
    body.childappend(statementOrBlock());
    this.childappend(body);
    return this;

symbol("while").toJS = function () {
    r = '';
    r += this.write("while");
    r += this.space(False,result=r);
    // cond;
    r += '(';
    r += this.children[0].toJS();
    r += ')';
    // body;
    r += this.children[1].toJS();
    return r;

symbol("while").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

symbol("do");

symbol("do"));
def std():;
    this.type = "loop" // compat with Node.type;
    this.set("loopType", "DO");
    body = symbol("body")(token.get("line"), token.get("column"));
    body.childappend(statementOrBlock());
    this.childappend(body);
    advance("while");
    advance("(");
    this.childappend(expression(0));
    advance(")");
    return this;

symbol("do").toJS = function () {
    r = [];
    r.push("do");
    r.push(this.space());
    r.push(this.children[0].toJS());
    r.push('while');
    r.push('(');
    r.push(this.children[1].toJS());
    r.push(')');
    return r.join('');

symbol("do").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("with");

symbol("with"));
def std():;
    this.type = "loop" // compat. with Node.type;
    this.set("loopType", "WITH");
    advance("(");
    this.childappend(expression(0));
    advance(")");
    body = symbol("body")(token.get("line"), token.get("column"));
    body.childappend(statementOrBlock());
    this.childappend(body);
    return this;

// the next one - like with other loop types - is *used*, as dispatch is by class, ;
// not obj.type (cf. "loop".toJS());
symbol("with").toJS = function () {
    r = [];
    r += ["with"];
    r += ["("];
    r += [this.children[0].toJS()];
    r += [")"];
    r += [this.children[1].toJS()];
    return r.join('');

symbol("with").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

// while;
symbol("while").pfix = function () {
  token = next();
  assert(token.source=='while');
  advance('(');
  condition = token.pfix();
  body = token.pfix();
  this.addChild(condition, body);
  return this;
};

symbol("while").toJS = function () {
    var r = [;
      'while';
      ,'(';
      ,this.children[0].toJS();
      ,')';
      ,this.children[1].toJS();
      ''.join(]);
    return r;
};

// if - else;
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
    };
    return this;
};
.toJS = function () {
    r = '';
    // Additional new line before each loop;
    if (not this.isFirstChild(True) && not this.getChild("commentsBefore", False)) {
        prev = this.getPreviousSibling(False, True);

        // No separation after case statements;
        //if (prev != None && prev.type in ["case", "default"]) {
        //    pass;
        //elif this.hasChild("elseStatement") or this.getChild("statement").hasBlockChildren():;
        //    this.sep();
        //} else {
        //    this.line();
    r += this.write("if");
    // condition;
    r += this.write("(");
    r += this.children[0].toJS();
    r += this.write(")");
    // 'then' part;
    r += this.children[1].toJS();
    // (opt) 'else' part;
    if (len(this.children) == 3) {
        r += this.write("else");
        r += this.space();
        r += this.children[2].toJS();
    r += this.space(False,result=r);
    return r;

symbol("if").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;

symbol("loop");

////;
// TODO: Is this code used?!;
symbol("loop").toJS = function () {
    r = '';
    // Additional new line before each loop;
    if (not this.isFirstChild(True) && not this.getChild("commentsBefore", False)) {
        prev = this.getPreviousSibling(False, True);

        // No separation after case statements;
        if (prev != None && prev.type in ["case", "default"]) {
            pass;
        elif this.hasChild("elseStatement") or this.getChild("statement").hasBlockChildren():;
            this.sep();
        } else {
            this.line();

    loopType = this.get("loopType");

    if (loopType == "IF") {
        pass;

    elif loopType == "WHILE":;
        r += this.write("while");
        r += this.space(False,result=r);

    elif loopType == "FOR":;
        r += this.write("for");
        r += this.space(False,result=r);

    elif loopType == "DO":;
        r += this.write("do");
        r += this.space(False,result=r);

    elif loopType == "WITH":;
        r += this.write("with");
        r += this.space(False,result=r);

    } else {
        print "Warning: Unknown loop type: %s" % loopType;
    return r;


symbol("break");

symbol("break"));
def std():;
    //if (token.id not in StmntTerminatorTokens) {
    if (not expressionTerminated()) {
        this.childappend(expression(0))   // this is over-generating! (should be 'label');
    //advance(";");
    return this;

symbol("break").toJS = function () {
    r = this.write("break");
    if (this.children) {
        r += this.space(result=r);
        r += this.write(this.children[0].toJS());
    return r;

symbol("break").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("continue");

symbol("continue"));
def std():;
    //if (token.id not in StmntTerminatorTokens) {
    if (not expressionTerminated()) {
        this.childappend(expression(0))   // this is over-generating! (should be 'label');
    //advance(";");
    return this;

symbol("continue").toJS = function () {
    r = this.write("continue");
    if (this.children) {
        r += this.space(result=r);
        r += this.write(this.children[0].toJS());
    return r;

symbol("continue").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("return");

symbol("return"));
def std():;
    //if (token.id not in StmntTerminatorTokens) {
    if (not expressionTerminated()) {
        this.childappend(expression(0));
    return this;

symbol("return").toJS = function () {
    r = ["return"];
    if (this.children) {
        r.push(this.space());
        r.push(this.children[0].toJS());
    return r.join('');

symbol("return").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("new"))  // need to treat 'new' explicitly, for the awkward 'new Foo()' "call" synta.pfix = function () {
    arg = expression(this.bind_left-1)  // first, parse a normal expression (this excludes '()');
    if (token.id == '(') {  // if the next token indicates a call;
        t = token;
        advance("(");
        arg = t.ifix(left=arg)   // invoke '('.ifix, with class name as <left> arg;
    this.childappend(arg);
    return this;

symbol("new").toListG = toListG_self_first;


symbol("switch"); symbol("case"); symbol("default");

symbol("switch"));
def std():;
    advance("(");
    this.childappend(expression(0));
    advance(")");
    advance("{");
    body = symbol("body")(token.get("line"), token.get("column"));
    this.childappend(body);
    while (True) {
        if (token.id == "}") { break;
        elif token.id == "case":;
            case = token  // make 'case' the root node (instead e.g. ':');
            advance("case");
            case.childappend(expression(symbol(":").bind_left +1));
            advance(":");
            if (token.id in ("case", "default") ) { // fall-through;
                pass;
            } else {
                case.childappend(case_block());
        elif token.id == "default":;
            case = token;
            advance("default");
            advance(":");
            if (token.id in ("case",) ) { // fall-through;
                pass;
            } else {
                case.childappend(case_block());
        body.childappend(case);
    advance("}");
    return this;

def case_block():;
    // we assume here that there is at least one statement to parse;
    s = symbol("statements")(token.get("line"), token.get("column"));
    while (True) {
        if (token.id in ("case", "default", "}")) {
            break;
        s.childappend(statement());
    return s;


symbol("switch").toJS = function () {
    r = [];
    r.push("switch");
    // control;
    r.push('(');
    r.push(this.children[0].toJS());
    r.push(')');
    // body;
    r.push('{');
    body = this.getChild("body");
    for (var c in body.children)
        r.push(c.toJS());
    r.push('}');
    return r.join('');

symbol("switch").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("case").toJS = function () {
    r = [];
    r.push('case');
    r.push(this.space());
    r.push(this.children[0].toJS());
    r.push(':');
    if (len(this.children) > 1) {
        r.push(this.children[1].toJS());
    return r.join('');

symbol("case").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("default").toJS = function () {
    r = [];
    r.push('default');
    r.push(':');
    if (len(this.children) > 0) {
        r.push(this.children[0].toJS());
    return r.join('');

symbol("default").toListG = function () {
    for (var e in _chain([this], *[c.toListG() for c in this.children)
        return e;


symbol("try"); symbol("catch"); symbol("finally");

symbol("try"));
def std():;
    this.childappend(block());
    if (token.id == "catch") {
        catch = token;
        this.childappend(catch);
        advance("catch");
        //advance("(");
        //catch.childappend(expression(0));
        //advance(")");

        // insert "params" node, par. to function.pfix;
        assert token.id == "(";
        params = symbol("params")(token.get("line"), token.get("column"));
        catch.childappend(params);
        group = expression()  // group parsing as helper;
        for (var c in group.children)
            params.childappend(c)  // to have params as parent of group's children;

        catch.childappend(block());
    if (token.id == "finally") {
        finally_ = token;
        advance("finally");
        this.childappend(finally_);
        finally_.childappend(block());
    return this;

symbol("try").toJS = function () {
    r = [];
    r.push('try');
    r.push(this.children[0].toJS());
    catch = this.getChild("catch", 0);
    if (catch) {
        r.push('catch');
        //r.push('(');
        r.push(catch.children[0].toJS());
        //r.push(')');
        r.push(catch.children[1].toJS());
    finally_ = this.getChild("finally", 0);
    if (finally_) {
        r.push('finally');
        r.push(finally_.children[0].toJS());
    return r.join('');

symbol("try").toListG = toListG_self_first;
symbol("catch").toListG = toListG_self_first;
symbol("finally").toListG = toListG_self_first;


symbol("throw");

symbol("throw"));
def std():;
    if (token.id not in ("eol",  ";")) {
        this.childappend(expression(0));
    //advance(";");
    return this;

symbol("throw").toJS = function () {
    r = '';
    r += 'throw';
    r += this.space();
    r += this.children[0].toJS();
    return r;

symbol("throw").toListG = toListG_self_first;

def expression(bind_right=0):;
    global token;
    t = token;
    token = next();
    left = t.pfix();
    while (token.bind_left > bind_right) {
        t = token;
        token = next();
        left = t.ifix(left);
    return left;


symbol("label");

def statement():;
    // labeled statement;
    if ((token.type == "identifier" && tokenStream.peek(1).id == ") {") { // label;
        s = symbol("label")(token.get("line"), token.get("column"));
        s.attributes = token.attributes;
        advance();
        advance(":");
        s.childappend(statement());
    // normal SourceElement;
    } else {
        n = token;
        s = None ;
        // function declaration, doesn't need statementEnd;
        if (token.id == 'function' && tokenStream.peek(1).type == 'identifier') {
            advance();
            s = n.pfix();
            if (token.id == ';') {  // consume dangling semi;
                advance();
        // statement;
        } else {
            if (getattr(token, 'std', None)) {
                advance();
                s = n.std();
            elif token.id == ';': // empty statement;
                s = symbol("(empty)")();
            elif token.type != 'eol': // it's not an empty line;
                s = expression();
                // Crockford's too tight here;
                //if (not (s.id == "=" or s.id == "(")) {
                //    throw new Error("Bad expression statement (pos %r)" % ((token.get("line"), token.get("column")),));

                // handle expression lists;
                // (REFAC: somewhat ugly here, expression lists should be treated generically,;
                // but there is this conflict between ',' as an operator infix(",", 5);
                // && a stock symbol(",", 0) that terminates every expression() parse, like for;
                // arrays, maps, etc.).;
                if (token.id == ',') {
                    s1 = symbol("expressionList")(token.get("line"), token.get("column"));
                    s1.childappend(s);
                    s = s1;
                    while (token.id == ',') {
                        advance(',');
                        s.childappend(expression());
            statementEnd();
    return s;

symbol("statement").toJS = function () {
    return this.children[0].toJS();

symbol("statement").toListG = toListG_just_children;

symbol("(empty)").toJS = function () {
    return '';

symbol("(empty)").toListG = toListG_self_first;

symbol("label").toJS = function () {
    r = [];
    r += [this.get("value")]  // identifier;
    r += [":"];
    r += [this.children[0].toJS()];
    return r.join('');

symbol("label").toListG = toListG_self_first;


def statementEnd():;
    if (token.id in (";",)) {
        advance();
    //elif token.id == "eof":;
    //    return token  // ok as stmt end, but don't just skip it (bc. comments);
    elif tokenStream.eolBefore:;
        pass // that's ok as statement end;
    //if token.id in ("eof", ;
    //    "eol", // these are not yielded by the TokenStream currently;
    //    ";", ;
    //    "}"  // it's the last statement in a block;
    //    ):;
    //    advance();
    //} else {
    //    ltok = tokenStream.lookbehind();
    //    if (ltok.id == '}') {  // it's a statement ending with a block ('if' etc.);
    //        pass;
    //    } else {
    //        throw new Error("Unterminated statement (pos %r)" % ((token.get("line"), token.get("column")),));


symbol("eof").toJS = function () {
    return '';

symbol("eof").toListG = toListG_self_first;

def statementOrBlock(): // for 'if', 'while', etc. bodies;
    if (token.id == '{') {
        return block();
    } else {
        return statement();

def statements():  // plural!;
    s = symbol("statements")(token.get("line"), token.get("column"));
    while (True) {
        if (token.id == "}" or token.id == "eof") {
            if (token.id == "eof" && token.comments) {
                s.childappend(token)  // keep eof for pot. comments;
            break;
        st = statement();
        if (st) {
            //stmt = symbol("statement")(st.get("line"), st.get("column")) // insert <statement> for better finding comments later;
            //stmt.childappend(st);
            s.childappend(st);
    return s;


symbol("statements").toJS = function () {
    r = [];
    for (var cld in this.children)
        c = cld.toJS();
        r.push(c);
        if (not c or c[-1] != ';') {
            r.push(';');
    return r.join('');

symbol("statements").toListG = toListG_just_children;


def init_list():  // parse anything from "i" to "i, j=3, k,...";
    lst = [];
    while (True) {
        if (token.id != "identifier") {
            break;
        elem = expression();
        lst.push(elem);
        if (token.id != ",") {
            break;
        } else {
            advance(",");
    return lst;

// next is not used!;
def argument_list(list):;
    while (1) {
        if (token.id != "identifier") {
            throw new Error("Expected an argument name (pos %r)." % ((token.get("line"), token.get("column")),));
        list.push(token);
        advance();
        if (token.id == "=") {
            advance();
            list.push(expression());
        } else {
            list.push(None);
        if (token.id != ",") {
            break;
        advance(",");


