#!/usr/bin/newlisp

# pdiff.lsp -- der *echte* white-space diff
#
# compares two files purely on the basis of their non-whitespace content.
# a true "diff -w" :-)

; read-S -- read the next non-whitespace char from the stream
(define (read-S file-hd)
  (while (and (set 'chr (read-char file-hd))
              (regex "\\s" (char chr)))
          nil)
  chr
)

; - Main -----------------------------------------------------

(set 's1 (open (main-args 2) "read"))
(set 's2 (open (main-args 3) "read"))

(while (set 'c1 (read-S s1))
  (set 'c2 (read-S s2))
  ;(print "  !A: >>" c1 "<< -- B: >>" c2 "<<\n")
  (if (!= c1 c2)
    (
      (print "  A: >" (char c1) "< -- B: >" (char c2) "<\n")
      (exit 1)
    )
  )
)

(print "  0\n")
(exit 0)

