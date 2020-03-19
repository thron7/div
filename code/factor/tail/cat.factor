! re-implementation of 'tail -f'
USING: io.encodings.utf8 io.files io command-line namespaces 
       sequences ;
IN: tail

: <input-stream> ( -- stream ) 
    command-line get first utf8 <file-reader> ;

: cat ( -- ) 
    <input-stream> [ [ print ] each-line ] with-input-stream* ;

MAIN: cat
