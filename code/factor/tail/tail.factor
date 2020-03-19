! re-implementation of 'tail -f'

USING: accessors io io.encodings.utf8 io.files kernel namespaces 
    command-line sequences threads calendar io.private ;
IN: tail

: <input-stream> ( -- stream ) 
    command-line get first utf8 <file-reader> ;

: my-stream-contents* ( stream -- seq )
    [ [ stream-read1 dup ] curry [ ] ] [ stream-exemplar produce-as nip ] bi ;

: print-all ( seq -- )
    [ print ] each ;

: read-file-tail ( stream -- )
    500 milliseconds sleep
    [ my-stream-contents* print-all ] call ! keep
    ! read-file-tail 
    ;

: tail-f ( -- )
    <input-stream> [ read-file-tail ] with-input-stream* ;

MAIN: tail-f
