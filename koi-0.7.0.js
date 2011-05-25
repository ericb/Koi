/**
 * Koi
 * @desc A small Javascript utility that provides organizational helpers
 * @author Eric Bobbitt (eric@hellouser.net)
 * @version 0.7.0
 
 FreeBSD License
 
 Copyright 2011 Eric Bobbitt. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice, this list of
       conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright notice, this list
       of conditions and the following disclaimer in the documentation and/or other materials
       provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY ERIC BOBBITT ``AS IS'' AND ANY EXPRESS OR IMPLIED
 WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 The views and conclusions contained in the software and documentation are those of the
 authors and should not be interpreted as representing official policies, either expressed
 or implied, of Eric Bobbitt.
 
*/

if(typeof Koi == 'undefined') { Koi = {}; }

(function() {
    
    var f = function() {};
    var hooks = {
        len: 0
    };
    
    Koi = f.prototype;

    /**
     *  Add a Hook
     *  @param string    Hook Name
     *  @param function  Hook
     *  @param string    Hook Namespace (defaults to global)
     */
    Koi.addHook = function(name, hook, namespace) {
        if(!namespace)
            namespace = 'global';
        
        if(!hooks[namespace]) {
            hooks[namespace] = {};
        }
        
        hooks[namespace][name] = hook;
        hooks.len++;
    };
    
    /**
     *  Remove a Hook
     *  @param string  Hook Name
     *  @param string  Hook Namespace
     */
    Koi.removeHook = function(hook, namespace) {
      if(!namespace) { namespace = 'global'; }
      if(hooks[namespace] && hooks[namespace][hook]) {
          delete hooks[namespace][hook];
          hooks.len--;  
      }      
    };
    
    
    /**
     *  Inject Hooks
     *  Utility method to inject hooks into Koi defined objects.
     */
    var injectHooks = function( proto ) {
        for(var hook in hooks) {
            // Check if the hook is a global hook or if the Koi definition calls for the hook
            if(hook === 'global') {
                for(var x in hooks[hook]) {
                    hooks[hook][x](proto); // Run the Hook against the prototype object
                }
            }
            
            
            if(proto.hooks) {
                var len = proto.hooks.length;
                for(var i = 0; i < len; i++) {
                    if(proto.hooks[i] == hook) {
                        for(var x in hooks[hook]) {
                            hooks[hook][x](proto); // Run the Hook against the prototype object
                        }
                    }
                }
            }
        }
    };
    
    /**
     *  Define Method
     *  @param def {KoiDefinition} A basic object definition
     *  
     *  This is a very basic method to wrap an object definition inside 
     *  a function so that it may be instantiated.
     *  
     *  Reserved Names:
     *  @_parent If nesting is provided, all parent defintions will be stored in this property.
     *  @init If provided, the init function will be run as a constructor
     *  @hooks {Array} An array of hook names to be used when instantiating.
     */
    Koi.define = function(def) {
        var tmp = function() {
            if(this.init && typeof this.init == 'function') {
                this.init.apply(def, arguments);
            }
        };
        if(hooks.len > 0) { injectHooks(def); }
        tmp.prototype = def;
        return tmp;
    };
    
    /**
     *  Extend Method
     *  @param parent {KoiDefinition} Parent Koi Definition
     *  @param def {KoiDefinition} Koi Definition to extend Parent Koi Definition
     *  @param nest {Boolean} Whether to store the parent Koi overrides in _parent property
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
     *  Namespace Method
     *  Registers a global object and returns Koi.
     *  @param string Namespace to create
     *  @param string Context Object where the namespacing is applied. Default context is the window object
     */
    Koi.namespace = function(namespace, context) {
        if(!context)
            context = window;
        try {
            var type = typeof context[namespace];
            if(type == 'undefined') { 
                context[namespace] = {}; 
            }
        } catch(e) {}
        
        return Koi;
    };
    
    return Koi;
})();