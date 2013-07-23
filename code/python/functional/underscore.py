#!/usr/bin/env python

# Functions inspired by underscore.js

def pick(map_, *keys):
    return dict((k,v) for k,v in map_.items() if k in keys)


