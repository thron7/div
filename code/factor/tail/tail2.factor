! re-implementation of 'tail -f'
! USING: io.encodings.utf8 io.files io command-line namespaces 
!        sequences ;
! IN: tail
! 
! : <input-stream> ( -- stream ) 
!     command-line get first utf8 <file-reader> ;
! 
! : cat ( -- ) 
!     <input-stream> [ [ print ] each-line ] with-input-stream* ;
! 
! : tail-f ( -- ) 
!     <input-stream> [ [ print ] each-line ] with-input-stream* ;
!     ! each-line seems to close at end of file
! 
! MAIN: tail-f
USING: accessors io io.encodings.utf8 io.files io.monitors kernel namespaces 
    command-line sequences ;
IN: examples.files.tail

: emit-changes ( monitor -- )
    dup next-change drop
    input-stream get output-stream get stream-copy* flush
    emit-changes ;

: seek-input-end ( -- )
    0 seek-end input-stream get stream>> stream-seek ;

: tail-file ( fname -- )
    [
        dup f <monitor> swap utf8 [
            seek-input-end emit-changes
        ] with-file-reader
    ] with-monitors ;

: tail-f ( -- )
    command-line get first
    tail-file ;

MAIN: tail-f
