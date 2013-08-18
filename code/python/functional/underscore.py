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
        kwargs.update(akwargs)
        return fun(*args, **kwargs)
    return f

# Pipeline - compose functions where one takes the return value of the previous
import functools
def pipeline(seed, *args):
    return functools.reduce(lambda accu,elem: elem(accu),
        args, seed)

# Actions - compose functions that take different 'shapes' as inputs
# @param acts - list of action functions
# @param done - last function to extract the final result
# Adapter data:
# { 'values' : [] - growing list of individual action results
#   'state'  : <val> - carries the cumulative result
# }
def actions(acts, done):
    # run individual action
    def g(stateObj, action):
        result = action(stateObj.state)
        values = stateObj.values + [result.answer]
        return { 'values': values, 'state': result.state }
    # run all actions
    def f(seed):
        init = { 'values' : [], 'state': seed}
        intermediate = functools.reduce(g, acts, init)
        keep = filter(None, intermediate.values) 
        return done(keep, intermediate.state)
    return f

# Lift - helper for action creation
def lift(answerFun, stateFun=None):
    def f(*args):
        def g(state):
            ans = answerFun(*([state]+args))
            s = stateFun(state) if stateFun is not None else ans
            return {'answer': ans, 'state': s}
        return g
    return f



