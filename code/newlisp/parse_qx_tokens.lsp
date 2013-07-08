#!/usr/bin/newlisp

# go through tokenizer.py output and look for specific keys

(set 'file (open (main-args 2) "read"))
(while (read-line file)
  (replace {(source|type)'\s*:\s*([^,]*),} (current-line) (print $1 ":" $2 " -- ") 1)
  (println)
  )

(close file)

(exit 0)
