#!/usr/bin/newlisp

; NAME
;  compareTree -- compare two directory trees
;
; DESCRIPTION
;  Take two directories. The first is considered the 'master'. Both trees are
;  compared recursively (links?). Files or directories not present in the other
;  tree are listed, files and directories of the same path/name are compared for
;  their file properties and/or size (no diff).


(set 'dir1 (main-args 2))
(if (not (directory? dir1))
    (exit 1))
(change-dir dir1)

(dolist (entry (directory dir1))
    (if (directory? (join (list dir1 "/" entry)))
        (println "  Directory: " entry)
        (println "  File     : " entry)))


;(dolist (file-name (3 (main-args)))
;   (set 'file (open file-name "read"))
;   (println "file ---> " file-name)
;   (while (read-line file)
;      (if (find (main-args 2) (current-line) 0)
;         (write-line)))
;   (close file))

(exit)


