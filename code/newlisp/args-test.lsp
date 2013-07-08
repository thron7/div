#!/usr/bin/newlisp


(set 'cnt 0)
(dolist (item (main-args))
   (println "arg " cnt ": " item)
   (inc 'cnt)
   )

(exit)


