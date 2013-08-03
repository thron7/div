#!/usr/bin/env python

# Functions inspired by underscore.js/"Functional JavaScript" (Fogus)

# Pick submap
def pick(map_, *keys):
    return dict((k,v) for k,v in map_.items() if k in keys)

# Omit submap
def omit(map_, *keys):
    return dict((k,v) for k,v in map_.items() if k not in keys)
