/**
 *  Koi Examples
 *  @author Eric Bobbitt
 */
 
 
/************ DEFINING **************************/
 
// Defining a basic object the old way
var TestClass = (function() {
    var temp = function() {};
    var proto = temp.prototype;
    proto.name = 'TestClass';
    return temp;
})();

// Defining the same object the Koi way
// Notice the use of Koi.define() which is passed a real javascript object.
var TestClass = Koi.define({
    name: 'TestClass'
});


/************ EXTENDING **************************/


// Extending that same object the old way...
var NewTestClass = (function() {
    var temp = TestClass;
    var proto = temp.prototype;
    proto.extraName = 'NewTestClass';
    return temp;
})();

// Extending that same object the Koi way..
var NewTestClass = Koi.extend(TestClass, {
   extraName: 'NewTestClass'; 
});



/************ CONSTRUCTORS **************************/


// the old way
/*  UH OH! You run into a major problem here. 
    Running a constructor this way will run immediately when the object is defined.
    Meaning it's always run whether you instantiate the object or not.
    There are a few ways to solve this problem, but require that you put a lot of logic into the definition itself.
    Every.. damn... time.
*/  
var ConstructorObject = (function() {
    var temp = function() {};
    var proto = temp.prototype;
    proto.init = function(name) {
        alert(name);
    };
    proto.init();
    return temp;
})();


// now the Koi way!
/*
    init is a reserved keyword in the Koi framework. Any Koi object with an init method in the object will automatically be called
    when you use the new keyword. e.g. var test = new ConstructorObject('hello') would alert 'Hello'
*/
var ConstructorObject = Koi.define({
    init: function(name) {
        alert(name);
    }
});



/************ PRIVATE VARIABLES **************************/

// the old way
var ConstructorObject = (function() {
    var privateVar = 'secret';
    var temp = function() {};
    var proto = temp.prototype;
    proto.getPrivate = function() {
        alert(privateVar);
    };
    return temp;
})();

// the koi way
/*
    Due to the fact that javascript scopes at the time of definition,
    there is no way for Koi to have a private object within itself.
    Therefore we still need to scope the private variables manually.
    
    Koi.namespace() is a utility method to setup a global object.
    It enforces that myApp exists, or creates it if it doesn't.
    You can supply a secondary argument to define the scope, otheriwse
    it is scoped to the window object. You'll want this 99.9% of the time.
*/
Koi.namespace('myApp');
myApp.ConstructorObject = (function() {
    var privateVar = 'secret';
    var obj = Koi.define({
        getPrivate: function() {
            alert(privateVar);
        }
    });
    return obj;
})();



/************ KOI HOOKS **************************/

Koi.addHook('stats', function(obj) {
   obj.hp      = 0;
   obj.mp      = 0;
}, 'player');

Koi.addHook('info', function(obj) {
   obj.name   = 'Character Name';
   obj.gold   = 100;
   obj.silver = 10;  
}, 'player');

var Character = new Koi.define({
   hooks: ['player'],
   
   getName: function() {
       return this.name;
   },
   
   init: function(name) {
       if(name) {
           this.name = name;
       }
       console.log(this.getName());
   } 
});