function first(a) {
  return a[0];
}

function defined(x) {
    return !undef(x);
}

function undef(x) {
  return (typeof(x) == 'undefined');
}

module.exports = {
    
    first : first,

    defined : defined,

    undef : undef,

}
