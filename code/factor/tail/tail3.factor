! works in the listener, don't know in a script

USING: io.private ;

: my-stream-contents* ( stream -- seq )
    [ [ stream-read1 dup ] curry [ ] ] [ stream-exemplar produce-as nip ] bi ;

"/tmp/foo" utf8 <file-reader> [ my-stream-contents* print ] keep

... (later)

"/tmp/foo" utf8 <file-reader> [ my-stream-contents* print ] keep
