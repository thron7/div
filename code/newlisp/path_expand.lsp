#!/usr/bin/newlisp

# path_expand.lsp -- doing various path conversions
#
# syntax: path_expand.lsp ~/workspace     rel -> ../../workspace
#         path_expand.lsp ../../workspace abs -> /home/thron7/workspace
#

; rel-path -- find the relative path from pwd to given path
(define (rel-path path-exp)
  (letn ((cwd (real-path))
         (common (find-common-prefix cwd (real-path path-exp)))
         (ups (part-to-ups (common 1)))
         )
    (println (join (list ups "/" (common 2))))
    )
)

(define (abs-path path-exp)
  (println (real-path path-exp))
)

(define (find-common-prefix p1 p2)
  ;'("/home/thron7/" "div/1u1" "workspace/qooxdoo.trunk")
  (let ((a1 (parse p1 "/")) (a2 (parse p2 "/")) (com nil) (common "") (p1rest 
     "") 
    (p2rest "") 
    (ind 0) 
    (break false)) 
   (for (i 0 (length a1) 1 break) 
    (if (or (>= i (length a2)) (!= (a1 i) (a2 i))) 
     (begin 
      (set 'ind i) 
      (set 'break true))
     (push (a1 i) com))) 
   (set 'p1rest (join (ind a1) "/")) 
   (set 'p2rest (join (ind a2) "/")) 
   (set 'common (join (reverse com) "/"))
   (list common p1rest p2rest)))

(define (part-to-ups part)
  ;"../.."
  (let ((a1 (parse part "/")) (s nil))
    (for (i 1 (length a1))
      (push ".." s))
    (join s "/"))
)


; - Main -----------------------------------------------------

(set 'path-exp (main-args 2))
(set 'conversion (main-args 3))


(case conversion
  ("rel" ;(println "doing relativization")
         (rel-path path-exp))
  ("abs" ;(println "finding absolute path")
         (abs-path path-exp))
)

(exit 0)

