#!/usr/bin/newlisp

# usage: makefile_doc.lsp  <file>

(set 'pattern "^#")

(dolist (file-name (2 (main-args)))
   (set 'file (open file-name "read"))
   (println "file ---> " file-name)
   (while (read-line file)
      (if (find pattern (current-line) 0)
         (write-line)))
   (close file))

(exit)


