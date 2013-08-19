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
# @param acts[] - list of action functions
# @param done/2 - last function to extract the final result
# Adapter data:
# { 'values' : [] - growing list of individual action results
#   'state'  : <val> - carries the cumulative result
# }
# Example:
# actions([lambda x:{'answer':x*x,'state':x*x}], lambda x,y:y)(2)  # => 4
def actions(acts, done):
    # run individual action
    def g(state, action):
        result = action(state['state']) # this can be a lift'ed function, s.f.
        values = state['values'] + [result['answer']]
        return { 'values': values, 'state': result['state'] }
    # run all actions
    def f(seed):
        init = { 'values' : [], 'state': seed}
        intermediate = functools.reduce(g, acts, init)
        keep = filter(None, intermediate['values']) 
        return done(keep, intermediate['state'])
    return f

# Lift - helper for action creation
# Example:
# bar = lambda x:x*x
# foo = lift(bar)
# actions([foo()], lambda x,y:y)(2)   # => 4
def lift(answerFun, stateFun=None):
    def f(*args): # to pass some args to answerFun that don't change with state
        def g(state):
            ans = answerFun(*((state,)+args)) # work on state
            s = stateFun(state,ans) if stateFun is not None else ans # compute new state
            return {'answer': ans, 'state': s} # that's what actions() expects
        return g
    return f


# Mactions, Mlift - These are minimal versions of the above. No bookkeeping of
# intermediate 'values', the 'state' is the result (so no 'done'), only a
# 'statefun' to be able to combine previous result with current (also e.g. to
# skip None result).
# Example:
# def foo(x): print(x)
# mactions([mlift(bar), mlift(foo,lambda x,y:x), mlift(bar)])(2) # => (console) 4 => 16
def mactions(acts):
    def g(accu, action):
        return action(accu)
    def f(seed):
        result = functools.reduce(g, acts, seed)
        return result
    return f

def mlift(ansfun, statefun=None):
    def g(state):
        result = ansfun(state)
        return statefun(state, result) if statefun else result
    return g
