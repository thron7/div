#!/usr/bin/env python

#execfile("/home/thron7/workspace/githop/thron7.div.git/code/python/functional/underscore.py")
from underscore import *

import operator

l1 = ['a','b']
l2 = ['c','d']

first = lambda l: list(l[0])
second = lambda l: list(l[1])
cat = operator.concat
# compute: cat(first(l1), second(l2)) => ['a','d']

def stateFun(state, ans):
    state[2].append(ans)
    return state
    
def mfirst(state):
    return first(state[0])
mfirst = lift(mfirst,stateFun)

def msecond(state):
    return second(state[1])
msecond = lift(msecond,stateFun)

def mcat(state):
    return cat(*state[2])
mcat = lift(mcat,stateFun)


a = actions([
    mfirst(),
    msecond(),
    mcat()], lambda values,state: values[-1]
    )

#a([l1,l2,[]])

# The same problem, addressed with a pipeline
# (The original problem was:
# os.path.join(os.path.dirname(a), os.path.basename(b)))

a1 = lambda l1, l2 : pipeline(
        l1
        ,first
        ,bind(bind, cat)              # => cat(first(l1), _), uncalled
        ,curry2(apply, (second(l2),)) # => call(cat, first(l1), second(l2)), uncalled
        ,apply
        )

# The pipeline version requires far less adaptor code, but has some ugly
# higher-order expressions ("bind(bind...", "curry2(apply...").

#a1(l1, l2)
