#!/usr/bin/env python

# Functions inspired by underscore.js/"Functional JavaScript" (Fogus)

# Pick submap
def pick(map_, *keys):
    return dict((k,v) for k,v in map_.items() if k in keys)

# Omit submap
def omit(map_, *keys):
    return dict((k,v) for k,v in map_.items() if k not in keys)

# Curry named arguments
# usage:
# def foo(a,b,c):
#     print a,b,c
# f1 = curryN(foo,'b',2)
# f1(1,c=3) # args *before* curried can still be positional
def curryN(fun, arg, val):
    kwargs = dict([(arg,val)])
    def f(*args, **akwargs):
        akwargs.update(kwargs)
        return fun(*args, **akwargs)
    return f


