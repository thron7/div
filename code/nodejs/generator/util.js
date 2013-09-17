module.exports = {
    
    first : function first(a) {
      return a[0];
    },

    defined : function defined(x) {
        return !undef(x);
    },

    undef : function undef(x) {
      return (typeof(x) == 'undefined');
    }

}
