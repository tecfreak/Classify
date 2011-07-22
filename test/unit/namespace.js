module("namespace");

test("retrieval and creation", function() {
	var ns = getNamespace("Test");

	ok(ns instanceof Namespace, "getNamespace returned a namespace");
	equals(ns, getNamespace("Test"), "multiple calls to getNamespace returns the same object");
	equals(ns.getName(), "Test", "the name of the current namespace is stored");
	equals(ns.get("A"), null, "get class with no callback returns the class for use");
	equals(ns.get("A", function(c) {
		equals(c, null, "async call to get returns null as class doesn't yet exist");
	}), ns, "get class returns the namespace for chaining and gives ability to load up a class in a async manner");
});

test("class creation", function() {
	var ns = getNamespace("Test1");

	ok(!ns.exists("A"), "checking for existience of undefined class");
	ns.get("A", function(k) {
		equals(k, null, "attempting to retieve a undefined class");
	});

	// creating a single class
	var c = ns.create("A", {
		a : function() {
			return this;
		}
	});
	ok(!!c.__isclass_, "class created is a class object");
	ok(new c() instanceof base, "class creation created by extending the base class");
	equals(ns.A, c, "class reference is stored directly within namespace object");
	ns.get("A", function(k) {
		equals(k, c, "class reference is stored in internal reference array");
	});
	equals(c.getNamespace(), ns, "namespaced class has a getter for the current namespace");

	// creating nested classes
	var d = ns.create("B.C", {
		b : function() {
			return this;
		}
	});
	equals(typeof ns.B, "object", "an intermediate container object is created by the namespace");
	ok(new d() instanceof base, "class creation created by extending the base class");
	equals(ns.B.C, d, "class reference is stored directly within namespace object (nested)");
	ns.get("B.C", function(k) {
		equals(k, d, "class reference is stored in internal reference array (nested)");
	});
});

test("class extension and implementation using named references", function() {
	var ns = getNamespace("Test2");

	// extending a class with a named instance
	var c = ns.create("A", {
		a : function() {
			return 1;
		}
	});

	// extending a named reference in a namespace
	var d = ns.create("B", "A", {
		b : function() {
			return 2;
		}
	});
	equals(d.superclass, c, "extending classes using named references");
	equals(ns.B, d, "named reference is created within the namespace");

	// implementing classes using named references
	var e = ns.create("C", [ "A" ], {
		c : function() {
			return this;
		}
	});
	equals(e.prototype.a, c.prototype.a, "implementing a class using a named reference");
	equals(e.implement[0], c, "implement class reference stored internally");

	// implementing classes using a mixed reference
	var f = {
		d : function() {
			return 3;
		}
	};
	var g = ns.create("D", [ "A", f ], {
		e : function() {
			return 4;
		}
	});
	equals(g.prototype.a, c.prototype.a, "implementing a class using a named reference");
	equals(g.prototype.d, f.d, "implementing a object with a named reference");
	equals(g.implement[0], c, "implement class reference stored internally");
	equals(g.implement[1], f, "implement object reference stored internally");
});

test("removing named classes", function() {
	var ns = getNamespace("Test3");
	var ca = ns.create("A", {});
	var cb = ns.create("B", {});
	var cc = ns.create("A.C", {});
	var cd = ns.create("D", "A", {});
	var ce = ns.create("A.E", "A", {});
	var cf = ns.create("F", "A", {});

	// destroy an individual class
	ns.destroy("B");
	equals(typeof ns.B, "undefined", "removing a named class from the namespace");

	// destroy a class that is inherited from another class
	ns.destroy("D");
	equals(typeof ns.D, "undefined", "removing a named class from the namespace");
	equals(ns.A.subclass.indexOf(cd), -1, "remove class from the list of subclasses in the parent");

	// destroy a class namespace
	ns.destroy("A");
	equals(typeof ns.A, "undefined", "removing a named class from the namespace");
	ns.get("A.C", function(k) {
		equals(k, null, "removed leaf classes from branch namespace");
	});
	equals(typeof ns.F, "undefined", "removed class that extended a destroyed class");
	ns.get("F", function(k) {
		equals(k, null, "removed branch namespace that inherited from a removed branch");
	});
});

test("removing namespaces", function() {
	var ns = getNamespace("Test4");
	var ca = ns.create("A", {});
	var cb = ns.create("B", {});
	var cc = ns.create("A.C", {});
	var cd = ns.create("D", "A", {});
	var ce = ns.create("A.E", "A", {});
	var cf = ns.create("F", "A", {});

	destroyNamespace("Test4");

	// try to retrieve another instance of the "Test4" namespace
	var ns2 = getNamespace("Test4");
	ok(ns2 !== ns, "new instance of namespace is created");
});

test("class autoloading", function() {
	var ns = getNamespace("Test5");

	ns.get("A", function(k) {
		equals(k, null, "attempting to retieve a undefined class");
	});

	// create temp class
	var ca = ns.create("A", {});

	var temp = {};
	// setting the autoloader fora specific namespace
	ns.setAutoloader(function(name, callback) {
		equals(name, "B", "autoloader only being called if class doesn't exist.");
		callback(temp);
	});

	// testing autoloader
	ns.get("B", function(k) {
		equals(k, temp, "retrieving class through autoloader method");
	});
	ns.get("A", function(k) {
		equals(k, ca, "retrieving class already existing class");
	});
});
