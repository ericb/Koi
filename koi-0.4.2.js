/**
 * Koi
 * @desc A small Javascript utility that provides organizational helpers
 * @author Eric Bobbitt (eric@hellouser.net)
 * @version 0.4.2
 
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
    var plugins = {
        len: 0
    };
    var hooks = plugins;
    
    Koi = f.prototype;

    /**
     *  Add a Plugin
     *  @param string    Plugin Name
     *  @param function  Plugin
     *  @param string    Plugin Namespace (defaults to global)
     */
    Koi.add_plugin = function(name, plugin, namespace) {
        if(!namespace)
            namespace = 'global';
        
        if(!plugins[namespace]) {
            plugins[namespace] = {};
        }
        
        plugins[namespace][name] = plugin;
        plugins.len++;
    };
    Koi.addHook = Koi.add_plugin; // DEPRECATED (see Koi.add_plugin) as of version 0.13.0 -- Will be removed by version 1.0
    
    /**
     *  Remove a Plugin
     *  @param string  Plugin Name
     *  @param string  Plugin Namespace
     */
    Koi.remove_plugin = function(plugin, namespace) {
      if(!namespace) { namespace = 'global'; }
      if(plugins[namespace] && plugins[namespace][plugin]) {
          delete plugins[namespace][plugin];
          plugins.len--;  
      }      
    };
    Koi.removeHook = Koi.remove_plugin; // DEPRECATED (see Koi.remove_plugin) as of version 0.13.0 -- Will be removed by version 1.0
    
    
    /**
     *  Inject Plugins
     *  Utility method to inject hooks into Koi defined objects.
     */
    var injectPlugins = function( proto ) {
        for(var plugin in plugins) {
            // Check if the hook is a global hook or if the Koi definition calls for the hook
            if(plugin === 'global') {
                for(var x in plugins[plugin]) {
                    plugins[plugin][x](proto); // Run the Hook against the prototype object
                }
            }
            
            if(proto.plugins) {
                var len = proto.plugins.length;
                for(var i = 0; i < len; i++) {
                    if(proto.plugins[i] == plugin) {
                        for(var x in plugins[plugin]) {
                            plugins[plugin][x](proto); // Run the Plugin against the prototype object
                        }
                    }
                }
            }
        }
        
        // run the deprecated hooks
        for(var hook in hooks) {
            // Check if the hook is a global hook or if the Koi definition calls for the hook
            if(hook === 'global') {
                for(var x in hooks[hook]) {
                    hooks[hook][x](proto); // Run the Hook against the prototype object
                }
            }
            
            // proto.hooks is DEPRECATED as of 0.13.0 -- Please use proto.plugins instead -- Will be removed by version 1.0
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
     *  Import Method
     *  @param def {KoiDefinition}  The object you wish to import.
     *  @param string               The object member reference.
     *  @param array                The arguments to pass to the module init.
     *  
     *  This method is a shortcut method to set the imported module as a member 
     *  of the selected object as _name_. If _name_ already exists, it will be
     *  overwritten. This method instantiates the module.
     */
     Koi.import_as =  function( module, import_as, arglist ) {
         if(!module || !import_as) { return false; }
         if(typeof arglist == 'undefined') { var arglist = []; }

         // generate the temporary function
         var init = (function() {
             var temp_func = function() {}
             temp_func.prototype = module.prototype;
             return temp_func;
         })();

         this[import_as] = new init('koi-ignore-init');
         this[import_as].init.apply(this[import_as], arglist);
         return true;
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
            if(arguments && (typeof arguments[0] != undefined) && (arguments[0] == 'koi-ignore-init')) {
                // ignore the init function, just instantiate so we can override.
            } else {
                if(this.init && typeof this.init == 'function') {
                    this.init.apply(this, arguments);
                } 
            }
            
        };
        if(hooks.len > 0 || plugins.len > 0) { injectPlugins(def); }
        tmp.prototype = def;
        tmp.prototype.__koi_hooks = {};
        
        // add import function
        tmp.prototype.import_as = function( module, import_as, args ) {
            Koi.import_as.apply(this, [module, import_as, args]);
            return true;
        };
        
        // add hook function
        tmp.prototype.hook = function(name, hooks, args) {
            if(!hooks) { hooks = {}; }
            if(!args)  { args = [];  }
            if(typeof hooks[name] === 'function') {
                hooks[name].apply(this, args);
            }
        };
        
        // define hooks to check against
        tmp.prototype.use_hooks = function( obj ) {
            tmp.prototype.__koi_hooks = {};
            for(var x in obj) {
                if(typeof obj[x] === 'function') {
                    this.__koi_hooks[x] = obj[x];
                }
            }
            return tmp.prototype;
        };
        
        // get the defined hooks;
        tmp.prototype.get_hooks = function() {
            var hooks = Koi.clone_object( tmp.prototype.__koi_hooks );
            tmp.prototype.__koi_hooks = {};
            return hooks;
        };
        
        return tmp;
    };
    
    /**
     *  Extend Method
     *  @param parent {KoiDefinition} Parent Koi Definition
     *  @param def {KoiDefinition} Koi Definition to extend Parent Koi Definition
     *  @param nest {Boolean} Whether to store the parent Koi overrides in _parent property
     */
    Koi.extend = function(parent, def, nest) {
        var obj = new parent('koi-ignore-init');
        if(nest) {
        	if('undefined' != typeof obj._parent) {
        		obj._parent = { '_parent': obj._parent };
        	} else {
        		obj._parent = {};
        	}
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
    
    /**
     *  Clone Object
     *  Method to clone an object outright. All array / object references will be untied to their references.
     *  @param object   Object to clone
     */
    Koi.clone_object = function( merge ) {
        var _temp_obj = {};
        if( merge instanceof Array ) {
            _temp_obj = [];
        }
        for(var x in merge) {
           if(typeof merge[x] == 'object') {
              _temp_obj[x] = this.cloneObject( merge[x] );
           } else {
              _temp_obj[x] = merge[x];
           }
        }
        return _temp_obj;
    };
    
    Koi.state = function( context, states ) {
        
        var ObjectState = {};
        var _context    = false;
        if(context) { _context = context; }
        
        (function() {
            var s = function() {};
            ObjectState = s.prototype;
            
            ObjectState._index     = 0;
            ObjectState._states    = {};
            ObjectState._order     = [];
            ObjectState._disabled  = {};
            ObjectState._direction = 'forward';
            
            ObjectState.trigger = function( name, context, data ) {
                if(typeof this._disabled[name] != "undefined") { return this; }
                var _data = [];
                if((typeof data != "undefined")) { _data.push(data); }
                if((typeof context == "undefined" || !context)) { context = _context; }
                if(this._states[name]) {
                    this._state = name;
                    this.set_index();
                    if(context) {
                        this._states[name].apply(context, _data);
                    } else {
                        this._states[name](_data);
                    }
                }
                return this;
            };
            
            ObjectState.set_index = function( index ) {
                if(index) {
                    this._index = index;
                } else {
                    var state = this._state;
                    var order = this._order;
                    var count = 0;
                    for(var x in order) {
                        if(state == order[x]) {
                            this._index = count;
                        }
                        count++;
                    }
                }
            };
            
            ObjectState.order = function( order ) {
                if(order) { this._order = order; }
                return this;
            };
            
            ObjectState.disable = function( state ) {
                if(state) { this._disabled[state] = 1; }
            };
            
            ObjectState.enable = function( state ) {
                if(state) { delete this._disabled[state]; }
            };
                        
            ObjectState.add = function( name, state, force ) {
                if(typeof state != 'function') { return false; }
                var exists = this._states[name] ? true : false;
                if(!exists || (exists && force)) { this._states[name] = state; }
                return this;
            };
            
            ObjectState.remove = function ( name ) {
                var exists = this._states[name] ? true : false;
                if(exists) { delete this._states[name]; }
            };
            
            ObjectState.context = function( context ) {
                if(context) { _context = context; }
            };
            
            ObjectState.get_context = function() {
                return _context;
            };
            
            ObjectState.get_state = function() {
                return this._state;
            };
            
            ObjectState.next = function() {
                this._direction = 'forward';
                var count =  0;
                var skip  = true;
                var state = false;
                while(skip && count < 1000) {
                    count++;
                    try {
                        state = this._order[(this._index + count)];
                        if(typeof this._disabled[state] == "undefined") {
                            skip = false;
                        }
                    } catch(e) {}
                }
                if(state) { this.trigger(state); }
            };
            
            ObjectState.previous = function() {
                this._direction = 'backward';
                var count =  0;
                var skip  = true;
                var state = false;
                while(skip && count < 1000) {
                    count++;
                    try {
                        state = this._order[(this._index - count)];
                        if(typeof this._disabled[state] == "undefined") {
                            skip = false;
                        }
                    } catch(e) {}
                }
                if(state) { this.trigger(state); }
            };
            
            ObjectState.forward  = ObjectState.next;
            ObjectState.backward = ObjectState.previous;
            ObjectState.back     = ObjectState.previous;
            
            return ObjectState;
        })();
        
        
        // inject states
        if( typeof states != void(0) ) {
            for(var x in states) {
                ObjectState.add( x, states[x] );
            }
        }
        
        return ObjectState;
    };
        
    return Koi;
})();
