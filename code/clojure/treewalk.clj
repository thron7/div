;;
;; Walking the file system tree
;;

; reading directory
(def directory (clojure.java.io/file "/path/to/directory"))
(def files (file-seq directory))
(take 10 files)
