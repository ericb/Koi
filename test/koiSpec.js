describe("Koi", function() {

    var k = Koi.define({
        foo: 'bar'
    });

    var initk = Koi.define({
        name: false,
        ranInit: false,
        init: function(name) {
            if('undefined' != typeof name) {
                this.name = name;
            }
            this.ranInit = true;
        }
    });

    var func = (function() { var f = function(){ console.log('Non-Koi Constructor'); }; f.prototype.foo = 'bar'; return f; })();
    var speed_func = (function() { var f = function(){}; f.prototype.foo = 'bar'; return f; })();

    it("is available", function() {
        expect(typeof Koi).toBe('object'); 
    });

    it("has a define method", function() {
        expect(typeof Koi.define).toBe('function');
    });

    it("can define a class", function() {
        expect(typeof k).toBe('function'); 
    });

    it("can instantiate a class", function() {
        var klass = new k();
        expect(klass.foo).toBe('bar');
    });

    it("instantiated classes do not share the same space", function() {
        var k1 = new k();
        var k2 = new k();
        k2.foo = 'bar2';
        expect(k1.foo).toBe('bar');
        expect(k2.foo).toBe('bar2');
    });

    it("classes with constructors run them on instantiation", function() {
        var k1 = new initk();
        var k2 = new initk('Bob');
        expect(k1.ranInit).toBe(true);
        expect(k1.name).toBe(false);
        expect(k2.name).toBe('Bob');
    });

    it("classes can extend other Koi classes", function() {
        var k2 = Koi.extend(k, {
            'bar': 'foo'
        });

        var k1 = new k2();

        expect(k1.foo).toBe('bar');
        expect(k1.bar).toBe('foo');
    });

    it("classes can extend non Koi classes", function() {
        var k2 = Koi.extend(func, {
            'bar': 'foo'
        });

        var k1 = new k2();

        expect(k1.foo).toBe('bar');
        expect(k1.bar).toBe('foo');
    });

    it("can maintain a history of extended class methods", function() {
        var k1 = Koi.define({
            'foo': 'bar',
            init: function() {
                this.foo = 'bar';
            }
        });

        var k2 = Koi.extend(k1, {
            'bar': 'foo',
            init: function() {
                this._parent.init();
                this.bar = 'foo';
            }
        });

        var k3 = Koi.extend(k2, {
            'hello': 'world',
            init: function() {
                this._parent.init();
                this.hello = 'world';
            }
        });

        var k = new k3();

        expect(k.foo).toBe('bar');
        expect(k.bar).toBe('foo');
        expect(k.hello).toBe('world');
        expect(typeof k._parent._parent.init).toBe('function');
    });

    it("can create a namespace", function() {
        Koi.namespace("koi_namespace");
        expect(typeof koi_namespace).toBe('object');
        expect(koi_namespace).toEqual({});
    });

    it("will not override existing namespaces", function() {
        koi_namespace.test = 'bar';
        Koi.namespace("koi_namespace");
        expect(koi_namespace.test).toBe('bar');
    });

    it("can create namespaces under other namespaces", function() {
        Koi.namespace("sub_koi_namespace", koi_namespace);
        expect(typeof koi_namespace.sub_koi_namespace).toBe('object');
        expect(koi_namespace.sub_koi_namespace).toEqual({});
    });

    it("can create dot notation based namespaces", function() {
        Koi.namespace("dot_koi_namespace.sub_koi_namespace.deeper_koi_namespace");
        expect(typeof dot_koi_namespace).toBe('object');
        expect(typeof dot_koi_namespace.sub_koi_namespace).toBe('object');
        expect(typeof dot_koi_namespace.sub_koi_namespace.deeper_koi_namespace).toBe('object');
    });

    it("namespaces with dot notation will also not override existing namespaces", function() {
        Koi.namespace("koi_namespace.sub_koi_namespace"); 
        expect(koi_namespace.test).toBe('bar');
    });
});

describe("Koi hooks", function() {
    var k = Koi.define({
        testHooks: function(color) {
            var c = this.hook("color", [color]) || color;
            return c;
        },
        testMultipleHooks: function(color) {
            var c = this.hook("color", [color]) || color;
            c = this.hook("color2", [c]) || c;
            return c;
        }
    });

    it("are available", function() {
        var k1 = new k();
        expect(typeof k1.hook).toBe("function");
    });

    it("can be called", function() {
        var k1 = new k();
        var func = function(color) {
            return color.toUpperCase();
        }
        var color = Koi.util.hook({"color": func}, k1, k1.testHooks, ['red']);
        expect(color).toBe("RED");
    });

    it("can be called with multiple hooks", function() {
        var k1 = new k();
        var func = function(color) {
            return color.toUpperCase();
        }
        var func2 = function(color) {
            return color + '2';
        }
        var color = Koi.util.hook({"color": func}, k1, k1.testHooks, ['red']);
        expect(color).toBe("RED");

        var color = Koi.util.hook({"color": func, "color2": func2}, k1, k1.testMultipleHooks, ['red']);
        expect(color).toBe("RED2");
    });

    it("can be defined with Koi.hook()", function() {
        var k1 = new k();
        var func = function(color) {
            return color.toUpperCase();
        }
        var func2 = function(color) {
            return color.toLowerCase() + '2';
        }
        var color = Koi.hook({
            "color": func,
            "color2": func2
        }).to(k1).run(k1.testMultipleHooks, ['red']);
        expect(color).toBe("red2");
    });

    it("will require a binding for Koi.hook()", function() {
        var k1 = new k();
        var func = function(color) {
            return color.toUpperCase();
        }
        var func2 = function(color) {
            return color.toLowerCase() + '2';
        }
        var color = Koi.hook({
            "color": func,
            "color2": func2
        }).to(false);
        expect(function() { color.run(k1.testMultipleHooks, ['red']) }).toThrow("Koi.hook requires a valid context. Did you forget to use the to() method?");
    });

    it("are destroyed after each use", function() {
        var k1 = new k();
        var func = function(color) {
            return color.toUpperCase();
        }
        var color = Koi.util.hook({"color": func}, k1, k1.testHooks, ['red']);
        color = k1.testHooks('blue');
        expect(color).toBe("blue");
    });
});

describe("Koi util", function() {

    it("is available", function() {
        expect(typeof Koi.util).toBe('object'); 
    });

    it("has a clone method", function() {
        expect(typeof Koi.util.clone).toBe('function');
    });

    it("clone() will dereference objects and arrays", function() {
        var k = Koi.define({
            list: [1,2,3],
            obj: {
                "one": 1
            },
            nested: [{"hello": false}]
        });

        var k1 = new k();
        var k2 = new k();
        
        k1.list.push(4);
        k1.obj["two"] = 2;
        expect(k2.list).toEqual([1,2,3,4]);
        expect(k2.obj).toEqual({"one": 1, "two": 2});

        var k3 = Koi.util.clone(k2);
        k2.list.push(5);
        k2.obj["three"] = 3;
        k2.nested[0].hello = "world";

        expect(k2.list).toEqual([1,2,3,4,5]);
        expect(k3.list).toEqual([1,2,3,4]);
        expect(k2.obj).toEqual({"one": 1, "two": 2, "three": 3});
        expect(k3.obj).toEqual({"one": 1, "two": 2});
        expect(k2.nested[0].hello).toBe('world');
        expect(k3.nested[0].hello).toBe(false);
    });
});