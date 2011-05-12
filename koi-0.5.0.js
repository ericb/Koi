/**
 * Koi
 * @desc A small Javascript utility that provides organizational helpers
 * @author Eric Bobbitt (eric@hellouser.net)
 * @version 0.5.0
*/

if(typeof Koi == 'undefined') { Koi = {}; }

(function() {
    
    var version = '0.5.0';
    
    var f = function() {};
    var hooks = {
        len: 0
    };
    
    Koi = f.prototype;

    
    /**
     * Define Method
     * @param def {KoiDefinition} A basic object definition
     * 
     * This is a very basic method to wrap an object definition inside 
     * a function so that it may be instantiated.
     * 
     * Reserved Names:
     * @_parent If nesting is provided, all parent defintions will be stored in this property.
     * @init If provided, the init function will be run as a constructor
     * @hooks {Array} An array of hook names to be used when instantiating.
     */
    Koi.define = function(def) {
        var tmp = function() {
            if(this.init && typeof this.init == 'function') {
                this.init.apply(def, arguments);
            }
        };
        tmp.prototype = def;
        if(hooks.len > 0) {
            injectHooks(tmp);
        }
        return tmp;
    };
    
    /**
     * Extend Method
     * @param parent {KoiDefinition} Parent Koi Definition
     * @param def {KoiDefinition} Koi Definition to extend Parent Koi Definition
     * @param nest {Boolean} Whether to store the parent Koi overrides in _parent property
     */
    Koi.extend = function(parent, def, nest) {
        var obj = new parent();
        if(nest) {
        	obj._parent = {};
        	for(var x in obj) {
	            if(x != '_parent' && def[x])
	            	obj._parent[x] = obj[x];
	        }
        }
            
        for(var x in def) {
            obj[x] = def[x];
        }    
        return this.define(obj);
    };
    
    /**
     * Namespace Method
     * Registers a global object and applies an init method to shortcut Koi.init() calls.
     * @param namespace {String} String to convert into a global window object.
     * @param context {String} Context Object to where the namespacing is applied. Default is window
     */
    Koi.namespace = function(namespace, context) {
        if(!context)
            context = window;
        try {
            var type = typeof context[namespace];
            var register = function() {
                var n = context[namespace];
                n.init = function() {
                    var args = Array.prototype.slice.call(arguments);
                    args[0] = n[args[0]];
                    return Koi.init.apply(Koi, args);
                };
            };
            if(type == 'undefined') { 
                context[namespace] = {}; 
                register();
            } else if(type.toLowerCase() == 'object' && !context[namespace].init) {
                register();
            }
        } catch(e) {}
    };
    
    return Koi;
})();