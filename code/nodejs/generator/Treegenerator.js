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

// constant
symbol("constant").pfix = identity;

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
    this
}
