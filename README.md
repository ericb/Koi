Koi helps you write your object based javascript with style. To quickly get started, check out examples.js to see how you can benefit from using Koi.

Main Features:

 * Create Classes as Objects
 * Extend Classes with ease.
 * Import Methods to ease the inclusion of multiple objects.
 * Supports constructor methods.
 * Supports adding global & namespaced hooks


 # Features

 ## Class Definition

 Koi.define
 	- make classes with objects {}
 	- easy constructors with "init"
 	- 
 Koi.extend
 	- extend other classes easily
 	- non-koi classes will run constructors *beware* 

 ## Limitations

Due to the special nature of 'this', _parent objects can't always be called in the way you expect.
this._parent.init for e.g.

Shared objects still exist in Koi classes
Koi.define({ 'list': [1,2,3] });

 ## Plugin Architecture

 Koi.add