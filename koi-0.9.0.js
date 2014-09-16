/*

Koi

Copyright (c) 2014 Eric Bobbitt <eric@hellouser.net>

This software is provided 'as-is', without any express or implied
warranty. In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not
   claim that you wrote the original software. If you use this software
   in a product, an acknowledgment in the product documentation would be
   appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
 
*/

if('undefined' === typeof Koi) { 
    Koi = {};

    (function() {
        
        var f = function() {};
        var plugins = {};
        
        Koi = f.prototype;

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
                var callInit = (arguments[0] != 'koi-ignore-init');
                (callInit && this.init && typeof this.init === 'function' && this.init.apply(this, arguments))         
            };
            injectPlugins(def);
            tmp.prototype = def;
            tmp.prototype.__koi_hooks = {};
            
            // add hook function
            tmp.prototype.hook = function(name, args) {
                hooks = this.__koi_get_hooks();
                if(!args)  { args = [];  }
                if(typeof hooks[name] === 'function') {
                    return hooks[name].apply(this, args);
                } else {
                    return null;
                }
            };
            
            // get the defined hooks;
            tmp.prototype.__koi_get_hooks = function() {
                return Koi.util.clone( this.__koi_hooks );
            };

            tmp.toString = function() { return "KoiObject"; };

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
            if('undefined' === typeof nest) { nest = true; }
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
            context = context || window;
            var namespaces = namespace.split(".");
            var len = namespaces.length;
            for(var i = 0; i < len; i++) {
                if(i > 0) {
                    context = context[namespace];
                }
                namespace = namespaces[i];
                try {
                    if('undefined' === typeof context[namespace]) { context[namespace] = {}; }
                } catch(e) {}
            }
            return Koi;
        };

        Koi.hook = function(def) {
            var hooks = Koi.util.clone(def);
            var tmp = function() {};
            tmp.prototype.context = false;
            
            tmp.prototype.to = function(context) {
                this.context = context;
                return this;
            };

            tmp.prototype.run = function(func, args) {
                args = args || [];
                if(typeof this.context === 'undefined' || !this.context) {
                    throw "Koi.hook requires a valid context. Did you forget to use the to() method?";
                }
                return Koi.util.hook(hooks, this.context, func, args);
            };

            tmp.toString = function() { return "KoiHook"; };

            return new tmp();
        };

        Koi.namespace("util", Koi);
        
        /**
         *  Clone
         *  Method to clone an object or array. All array / object references will be untied to their references.
         *  @param object   Object to clone
         */
        Koi.util.clone = function( merge ) {
            var _temp_obj = {};
            if( merge instanceof Array ) { _temp_obj = []; }
            for(var x in merge) {
               if(typeof merge[x] == 'object') {
                  _temp_obj[x] = Koi.util.clone( merge[x] );
               } else {
                  _temp_obj[x] = merge[x];
               }
            }
            return _temp_obj;
        };

        // define hooks to check against
        Koi.util.hook = function( hook_obj, context, method, args ) {
            context.__koi_hooks = {};
            for(var x in hook_obj) {
                if(typeof hook_obj[x] === 'function') {
                    context.__koi_hooks[x] = hook_obj[x];
                }
            }
            var result = false;
            try {
                result = method.apply(context, args);  
            } catch(e) {}
            context.__koi_hooks = {};
            return result;
        };

         /**
         *  Add a Plugin
         *  @param string    Plugin Name
         *  @param function  Plugin
         *  @param string    Plugin Namespace (defaults to global)
         */
        Koi.add_plugin = function(name, plugin, namespace) {
            namespace = namespace || 'global';
            if(!plugins[namespace]) { plugins[namespace] = {}; }
            plugins[namespace][name] = plugin;
        };
        
        /**
         *  Remove a Plugin
         *  @param string  Plugin Name
         *  @param string  Plugin Namespace
         */
        Koi.remove_plugin = function(plugin, namespace) {
          namespace = namespace || 'global';
          if(plugins[namespace] && plugins[namespace][plugin]) { delete plugins[namespace][plugin]; }      
        };
        
        
        /**
         *  Inject Plugins
         *  Utility method to inject hooks into Koi defined objects.
         */
        var injectPlugins = function( proto ) {
            for(var plugin in plugins) {
                
                // run global plugins
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
        };
            
        return Koi;
    })(); 
}
