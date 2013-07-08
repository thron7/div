#!/usr/bin/newlisp

# usage: filter-test.lsp "regexp-pattern" <file>

(dolist (file-name (3 (main-args)))
   (set 'file (open file-name "read"))
   (println "file ---> " file-name)
   (while (read-line file)
      (if (find (main-args 2) (current-line) 0)
         (write-line)))
   (close file))

(exit)


