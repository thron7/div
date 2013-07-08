#!/usr/bin/newlisp

# usage: pipe-test.lsp < <stream>

(while (read-line) (println (upper-case (current-line))))

