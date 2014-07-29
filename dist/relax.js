!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Relax=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
function Delta(obj) {
  Object.defineProperty(this, "_obj", { value: obj });
};

Delta.prototype.apply = function(rho) {
  for (var p in this) {
    if (this.hasOwnProperty(p)) {
      this._obj[p] += this[p] * rho;
      this[p] = 0;
    }
  }
};

Delta.prototype.isSignificant = function(epsilon) {
  for (var p in this) {
    if (this.hasOwnProperty(p) && Math.abs(this[p]) > epsilon) {
      return true;
    }
  }
  return false;
};

module.exports = Delta;


},{}],2:[function(_dereq_,module,exports){
function installArithmeticConstraints(Relax) {

  // This is a collection of arithmetic constraints that can be applied to
  // arbitrary properties of arbitrary objects. "References" are represented
  // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

  Relax.arith = {};

  // Value Constraint, i.e., o.p = value

  Relax.arith.ValueConstraint = function(ref, value) {
    this.ref = ref;
    this.value = value;
    this.dObj = Relax.makeDeltaFor(ref.obj);
  }

  Relax.arith.ValueConstraint.prototype.computeDeltas = function(timeMillis) {
    this.dObj[this.ref.prop] = this.value - this.ref.obj[this.ref.prop];
  };

  // Equality Constraint, i.e., o1.p1 = o2.p2

  Relax.arith.EqualityConstraint = function(ref1, ref2) {
    this.ref1 = ref1;
    this.ref2 = ref2;
    this.dObj1 = Relax.makeDeltaFor(ref1.obj);
    this.dObj2 = Relax.makeDeltaFor(ref2.obj);
  }

  Relax.arith.EqualityConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = this.ref1.obj[this.ref1.prop] - this.ref2.obj[this.ref2.prop];
    this.dObj1[this.ref1.prop] = -diff / 2;
    this.dObj2[this.ref2.prop] = +diff / 2;
  };

  // Sum Constraint, i.e., o1.p1 + o2.p2 = o3.p3

  Relax.arith.SumConstraint = function(ref1, ref2, ref3) {
    this.ref1 = ref1;
    this.ref2 = ref2;
    this.ref3 = ref3;
    this.dObj1 = Relax.makeDeltaFor(ref1.obj);
    this.dObj2 = Relax.makeDeltaFor(ref2.obj);
    this.dObj3 = Relax.makeDeltaFor(ref3.obj);
  }

  Relax.arith.SumConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = this.ref3.obj[this.ref3.prop] - (this.ref1.obj[this.ref1.prop] + this.ref2.obj[this.ref2.prop]);
    this.dObj1[this.ref1.prop] = +diff / 3;
    this.dObj2[this.ref2.prop] = +diff / 3;
    this.dObj3[this.ref3.prop] = -diff / 3;
  };
}

module.exports = installArithmeticConstraints;


},{}],3:[function(_dereq_,module,exports){
function installGeometricConstraints(Relax) {

  // This is a collection of geometric constraints that can be applied to
  // objects that have x and y properties. Other properties are ignored.

  Relax.geom = {};

  // Helpers

  function square(n) {
    return n * n;
  }

  function plus(p1, p2) {
    return {x: p1.x + p2.x, y: p1.y + p2.y};
  }

  function minus(p1, p2) {
    return {x: p1.x - p2.x, y: p1.y - p2.y};
  }

  function scaledBy(p, m) {
    return {x: p.x * m, y: p.y * m};
  }

  function copy(p) {
    scaledBy(p, 1);
  }

  function magnitude(p) {
    Math.sqrt(square(p.x) + square(p.y));
  }

  function normalized(p) {
    return scaledBy(p, 1 / p.magnitude);
  }

  function rotatedBy(p, dTheta) {
    var theta = Math.atan2(p.y, p.x) + dTheta;
    var mag = magnitude(p);
    return {x: mag * Math.cos(theta), y: mag * Math.sin(theta)};
  }

  // Coordinate Constraint, i.e., "I want this point to be here".

  Relax.geom.CoordinateConstraint = function(p, x, y) {
    this.p = p;
    this.c = {x: x, y: y};
    this.dP = Relax.makeDeltaFor(p);
  }

  Relax.geom.CoordinateConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = minus(this.c, this.p);
    this.dP.x = diff.x;
    this.dP.y = diff.y;
  };

  // Coincidence Constraint, i.e., I want these two points to be at the same place.

  Relax.geom.CoincidenceConstraint = function(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
  }

  Relax.geom.CoincidenceConstraint.prototype.computeDeltas = function(timeMillis) {
    var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5);
    this.dP1.x = +splitDiff.x;
    this.dP1.y = +splitDiff.y;
    this.dP2.x = -splitDiff.x;
    this.dP2.y = -splitDiff.y;
  };

  // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

  Relax.geom.EquivalenceConstraint = function(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
    this.dP3 = Relax.makeDeltaFor(p3);
    this.dP4 = Relax.makeDeltaFor(p4);
  }

  Relax.geom.EquivalenceConstraint.prototype.computeDeltas = function(timeMillis) {
    var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25);
    this.dP1.x = this.dP4.x = +splitDiff.x;
    this.dP1.y = this.dP4.y = +splitDiff.y;
    this.dP2.x = this.dP3.x = -splitDiff.x;
    this.dP2.y = this.dP3.y = -splitDiff.y;
  };
}

module.exports = installGeometricConstraints;


},{}],4:[function(_dereq_,module,exports){
// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var Delta = _dereq_('./Delta.js');
var installArithmeticConstraints = _dereq_('./arithmetic-constraints.js');
var installGeometricConstraints = _dereq_('./geometric-constraints.js');

// --------------------------------------------------------------------
// Public
// --------------------------------------------------------------------

function Relax() {
  this.rho = 0.25;
  this.epsilon = 0.01;
  this.things = [];
}

Relax.makeDeltaFor = function(obj) {
  return new Delta(obj);
};

Relax.prototype.add = function(thing) {
  this.things.push(thing);
};

Relax.prototype.remove = function(unwantedThing) {
  var self = this;
  this.things = this.things.filter(function(thing) {
    return thing !== unwantedThing &&
           !(isConstraint(thing) && involves(thing, unwantedThing));
  });
};

Relax.prototype.doOneIteration = function(timeMillis) {
  if (this.beforeEachIteration) {
    (this.beforeEachIteration)();
  }
  var self = this;
  var didSomething = false;
  this.things.forEach(function(c) {
    if (isConstraint(c)) {
      c.computeDeltas(timeMillis);
      didSomething = didSomething || hasSignificantDeltas(self, c);
    }
  });
  if (didSomething) {
    this.things.forEach(function(c) {
      if (isConstraint(c)) {
        applyDeltas(self, c);
      }
    });
  }
  return didSomething;
};

Relax.prototype.iterateForUpToMillis = function(tMillis) {
  var count = 0;
  var didSomething;
  var now, t0, t;
  now = t0 = Date.now();
  do {
    didSomething = this.doOneIteration(now);
    now = Date.now();
    t = now - t0;
    count += didSomething ? 1 : 0;
  } while (didSomething && t < tMillis);
  return count;
};

// --------------------------------------------------------------------
// Private
// --------------------------------------------------------------------

function isConstraint(thing) {
  return thing.computeDeltas !== undefined;
};

function hasSignificantDeltas(relax, constraint) {
  for (var p in constraint) {
    var d = constraint[p];
    if (d instanceof Delta && d.isSignificant(relax.epsilon)) {
      return true;
    }
  }
  return false;
};

function applyDeltas(relax, constraint) {
  for (var p in constraint) {
    var d = constraint[p];
    if (d instanceof Delta) {
      d.apply(relax.rho);
    }
  }
};

function involves(constraint, obj) {
  for (var p in constraint) {
    var d = constraint[p];
    if (d instanceof Delta && d._obj === obj) {
      return true;
    }
  }
  return false;
};

// --------------------------------------------------------------------
// Install constraint libraries
// --------------------------------------------------------------------

installArithmeticConstraints(Relax);
installGeometricConstraints(Relax);

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Relax;


},{"./Delta.js":1,"./arithmetic-constraints.js":2,"./geometric-constraints.js":3}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4L3NyYy9EZWx0YS5qcyIsIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9zcmMvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9zcmMvZ2VvbWV0cmljLWNvbnN0cmFpbnRzLmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4L3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBEZWx0YShvYmopIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiX29ialwiLCB7IHZhbHVlOiBvYmogfSk7XG59O1xuXG5EZWx0YS5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihyaG8pIHtcbiAgZm9yICh2YXIgcCBpbiB0aGlzKSB7XG4gICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgIHRoaXMuX29ialtwXSArPSB0aGlzW3BdICogcmhvO1xuICAgICAgdGhpc1twXSA9IDA7XG4gICAgfVxuICB9XG59O1xuXG5EZWx0YS5wcm90b3R5cGUuaXNTaWduaWZpY2FudCA9IGZ1bmN0aW9uKGVwc2lsb24pIHtcbiAgZm9yICh2YXIgcCBpbiB0aGlzKSB7XG4gICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkocCkgJiYgTWF0aC5hYnModGhpc1twXSkgPiBlcHNpbG9uKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZWx0YTtcblxuIiwiZnVuY3Rpb24gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhSZWxheCkge1xuXG4gIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGFyaXRobWV0aWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gIC8vIGFzIChvYmplY3QsIHByb3BlcnR5TmFtZSkgdHVwbGVzLCBlLmcuLCB7b2JqOiB5b3VyTW9tLCBwcm9wOiAnd2VpZ2h0J30uXG5cbiAgUmVsYXguYXJpdGggPSB7fTtcblxuICAvLyBWYWx1ZSBDb25zdHJhaW50LCBpLmUuLCBvLnAgPSB2YWx1ZVxuXG4gIFJlbGF4LmFyaXRoLlZhbHVlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZiwgdmFsdWUpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5kT2JqID0gUmVsYXgubWFrZURlbHRhRm9yKHJlZi5vYmopO1xuICB9XG5cbiAgUmVsYXguYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHRoaXMuZE9ialt0aGlzLnJlZi5wcm9wXSA9IHRoaXMudmFsdWUgLSB0aGlzLnJlZi5vYmpbdGhpcy5yZWYucHJvcF07XG4gIH07XG5cbiAgLy8gRXF1YWxpdHkgQ29uc3RyYWludCwgaS5lLiwgbzEucDEgPSBvMi5wMlxuXG4gIFJlbGF4LmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZjEsIHJlZjIpIHtcbiAgICB0aGlzLnJlZjEgPSByZWYxO1xuICAgIHRoaXMucmVmMiA9IHJlZjI7XG4gICAgdGhpcy5kT2JqMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihyZWYxLm9iaik7XG4gICAgdGhpcy5kT2JqMiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihyZWYyLm9iaik7XG4gIH1cblxuICBSZWxheC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGRpZmYgPSB0aGlzLnJlZjEub2JqW3RoaXMucmVmMS5wcm9wXSAtIHRoaXMucmVmMi5vYmpbdGhpcy5yZWYyLnByb3BdO1xuICAgIHRoaXMuZE9iajFbdGhpcy5yZWYxLnByb3BdID0gLWRpZmYgLyAyO1xuICAgIHRoaXMuZE9iajJbdGhpcy5yZWYyLnByb3BdID0gK2RpZmYgLyAyO1xuICB9O1xuXG4gIC8vIFN1bSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSArIG8yLnAyID0gbzMucDNcblxuICBSZWxheC5hcml0aC5TdW1Db25zdHJhaW50ID0gZnVuY3Rpb24ocmVmMSwgcmVmMiwgcmVmMykge1xuICAgIHRoaXMucmVmMSA9IHJlZjE7XG4gICAgdGhpcy5yZWYyID0gcmVmMjtcbiAgICB0aGlzLnJlZjMgPSByZWYzO1xuICAgIHRoaXMuZE9iajEgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMS5vYmopO1xuICAgIHRoaXMuZE9iajIgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMi5vYmopO1xuICAgIHRoaXMuZE9iajMgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMy5vYmopO1xuICB9XG5cbiAgUmVsYXguYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgZGlmZiA9IHRoaXMucmVmMy5vYmpbdGhpcy5yZWYzLnByb3BdIC0gKHRoaXMucmVmMS5vYmpbdGhpcy5yZWYxLnByb3BdICsgdGhpcy5yZWYyLm9ialt0aGlzLnJlZjIucHJvcF0pO1xuICAgIHRoaXMuZE9iajFbdGhpcy5yZWYxLnByb3BdID0gK2RpZmYgLyAzO1xuICAgIHRoaXMuZE9iajJbdGhpcy5yZWYyLnByb3BdID0gK2RpZmYgLyAzO1xuICAgIHRoaXMuZE9iajNbdGhpcy5yZWYzLnByb3BdID0gLWRpZmYgLyAzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHM7XG5cbiIsImZ1bmN0aW9uIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhSZWxheCkge1xuXG4gIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gIC8vIG9iamVjdHMgdGhhdCBoYXZlIHggYW5kIHkgcHJvcGVydGllcy4gT3RoZXIgcHJvcGVydGllcyBhcmUgaWdub3JlZC5cblxuICBSZWxheC5nZW9tID0ge307XG5cbiAgLy8gSGVscGVyc1xuXG4gIGZ1bmN0aW9uIHNxdWFyZShuKSB7XG4gICAgcmV0dXJuIG4gKiBuO1xuICB9XG5cbiAgZnVuY3Rpb24gcGx1cyhwMSwgcDIpIHtcbiAgICByZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueX07XG4gIH1cblxuICBmdW5jdGlvbiBtaW51cyhwMSwgcDIpIHtcbiAgICByZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueX07XG4gIH1cblxuICBmdW5jdGlvbiBzY2FsZWRCeShwLCBtKSB7XG4gICAgcmV0dXJuIHt4OiBwLnggKiBtLCB5OiBwLnkgKiBtfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHkocCkge1xuICAgIHNjYWxlZEJ5KHAsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFnbml0dWRlKHApIHtcbiAgICBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSk7XG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVkKHApIHtcbiAgICByZXR1cm4gc2NhbGVkQnkocCwgMSAvIHAubWFnbml0dWRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcbiAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKHAueSwgcC54KSArIGRUaGV0YTtcbiAgICB2YXIgbWFnID0gbWFnbml0dWRlKHApO1xuICAgIHJldHVybiB7eDogbWFnICogTWF0aC5jb3ModGhldGEpLCB5OiBtYWcgKiBNYXRoLnNpbih0aGV0YSl9O1xuICB9XG5cbiAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICBSZWxheC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24ocCwgeCwgeSkge1xuICAgIHRoaXMucCA9IHA7XG4gICAgdGhpcy5jID0ge3g6IHgsIHk6IHl9O1xuICAgIHRoaXMuZFAgPSBSZWxheC5tYWtlRGVsdGFGb3IocCk7XG4gIH1cblxuICBSZWxheC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBkaWZmID0gbWludXModGhpcy5jLCB0aGlzLnApO1xuICAgIHRoaXMuZFAueCA9IGRpZmYueDtcbiAgICB0aGlzLmRQLnkgPSBkaWZmLnk7XG4gIH07XG5cbiAgLy8gQ29pbmNpZGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZXNlIHR3byBwb2ludHMgdG8gYmUgYXQgdGhlIHNhbWUgcGxhY2UuXG5cbiAgUmVsYXguZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMuZFAxID0gUmVsYXgubWFrZURlbHRhRm9yKHAxKTtcbiAgICB0aGlzLmRQMiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMik7XG4gIH1cblxuICBSZWxheC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXModGhpcy5wMiwgdGhpcy5wMSksIDAuNSk7XG4gICAgdGhpcy5kUDEueCA9ICtzcGxpdERpZmYueDtcbiAgICB0aGlzLmRQMS55ID0gK3NwbGl0RGlmZi55O1xuICAgIHRoaXMuZFAyLnggPSAtc3BsaXREaWZmLng7XG4gICAgdGhpcy5kUDIueSA9IC1zcGxpdERpZmYueTtcbiAgfTtcblxuICAvLyBFcXVpdmFsZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlIHZlY3RvcnMgcDEtPnAyIGFuZCBwMy0+cDQgdG8gYmUgdGhlIHNhbWUuXG5cbiAgUmVsYXguZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgICB0aGlzLmRQMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMSk7XG4gICAgdGhpcy5kUDIgPSBSZWxheC5tYWtlRGVsdGFGb3IocDIpO1xuICAgIHRoaXMuZFAzID0gUmVsYXgubWFrZURlbHRhRm9yKHAzKTtcbiAgICB0aGlzLmRQNCA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwNCk7XG4gIH1cblxuICBSZWxheC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuMjUpO1xuICAgIHRoaXMuZFAxLnggPSB0aGlzLmRQNC54ID0gK3NwbGl0RGlmZi54O1xuICAgIHRoaXMuZFAxLnkgPSB0aGlzLmRQNC55ID0gK3NwbGl0RGlmZi55O1xuICAgIHRoaXMuZFAyLnggPSB0aGlzLmRQMy54ID0gLXNwbGl0RGlmZi54O1xuICAgIHRoaXMuZFAyLnkgPSB0aGlzLmRQMy55ID0gLXNwbGl0RGlmZi55O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cztcblxuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBEZWx0YSA9IHJlcXVpcmUoJy4vRGVsdGEuanMnKTtcbnZhciBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9hcml0aG1ldGljLWNvbnN0cmFpbnRzLmpzJyk7XG52YXIgaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9nZW9tZXRyaWMtY29uc3RyYWludHMuanMnKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gUmVsYXgoKSB7XG4gIHRoaXMucmhvID0gMC4yNTtcbiAgdGhpcy5lcHNpbG9uID0gMC4wMTtcbiAgdGhpcy50aGluZ3MgPSBbXTtcbn1cblxuUmVsYXgubWFrZURlbHRhRm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiBuZXcgRGVsdGEob2JqKTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih0aGluZykge1xuICB0aGlzLnRoaW5ncy5wdXNoKHRoaW5nKTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih1bndhbnRlZFRoaW5nKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy50aGluZ3MgPSB0aGlzLnRoaW5ncy5maWx0ZXIoZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcgIT09IHVud2FudGVkVGhpbmcgJiZcbiAgICAgICAgICAgIShpc0NvbnN0cmFpbnQodGhpbmcpICYmIGludm9sdmVzKHRoaW5nLCB1bndhbnRlZFRoaW5nKSk7XG4gIH0pO1xufTtcblxuUmVsYXgucHJvdG90eXBlLmRvT25lSXRlcmF0aW9uID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICBpZiAodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKSB7XG4gICAgKHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbikoKTtcbiAgfVxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBkaWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgdGhpcy50aGluZ3MuZm9yRWFjaChmdW5jdGlvbihjKSB7XG4gICAgaWYgKGlzQ29uc3RyYWludChjKSkge1xuICAgICAgYy5jb21wdXRlRGVsdGFzKHRpbWVNaWxsaXMpO1xuICAgICAgZGlkU29tZXRoaW5nID0gZGlkU29tZXRoaW5nIHx8IGhhc1NpZ25pZmljYW50RGVsdGFzKHNlbGYsIGMpO1xuICAgIH1cbiAgfSk7XG4gIGlmIChkaWRTb21ldGhpbmcpIHtcbiAgICB0aGlzLnRoaW5ncy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcbiAgICAgIGlmIChpc0NvbnN0cmFpbnQoYykpIHtcbiAgICAgICAgYXBwbHlEZWx0YXMoc2VsZiwgYyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGRpZFNvbWV0aGluZztcbn07XG5cblJlbGF4LnByb3RvdHlwZS5pdGVyYXRlRm9yVXBUb01pbGxpcyA9IGZ1bmN0aW9uKHRNaWxsaXMpIHtcbiAgdmFyIGNvdW50ID0gMDtcbiAgdmFyIGRpZFNvbWV0aGluZztcbiAgdmFyIG5vdywgdDAsIHQ7XG4gIG5vdyA9IHQwID0gRGF0ZS5ub3coKTtcbiAgZG8ge1xuICAgIGRpZFNvbWV0aGluZyA9IHRoaXMuZG9PbmVJdGVyYXRpb24obm93KTtcbiAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgIHQgPSBub3cgLSB0MDtcbiAgICBjb3VudCArPSBkaWRTb21ldGhpbmcgPyAxIDogMDtcbiAgfSB3aGlsZSAoZGlkU29tZXRoaW5nICYmIHQgPCB0TWlsbGlzKTtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIGlzQ29uc3RyYWludCh0aGluZykge1xuICByZXR1cm4gdGhpbmcuY29tcHV0ZURlbHRhcyAhPT0gdW5kZWZpbmVkO1xufTtcblxuZnVuY3Rpb24gaGFzU2lnbmlmaWNhbnREZWx0YXMocmVsYXgsIGNvbnN0cmFpbnQpIHtcbiAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG4gICAgdmFyIGQgPSBjb25zdHJhaW50W3BdO1xuICAgIGlmIChkIGluc3RhbmNlb2YgRGVsdGEgJiYgZC5pc1NpZ25pZmljYW50KHJlbGF4LmVwc2lsb24pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuZnVuY3Rpb24gYXBwbHlEZWx0YXMocmVsYXgsIGNvbnN0cmFpbnQpIHtcbiAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG4gICAgdmFyIGQgPSBjb25zdHJhaW50W3BdO1xuICAgIGlmIChkIGluc3RhbmNlb2YgRGVsdGEpIHtcbiAgICAgIGQuYXBwbHkocmVsYXgucmhvKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGludm9sdmVzKGNvbnN0cmFpbnQsIG9iaikge1xuICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcbiAgICB2YXIgZCA9IGNvbnN0cmFpbnRbcF07XG4gICAgaWYgKGQgaW5zdGFuY2VvZiBEZWx0YSAmJiBkLl9vYmogPT09IG9iaikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJbnN0YWxsIGNvbnN0cmFpbnQgbGlicmFyaWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFJlbGF4KTtcbmluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhSZWxheCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbGF4O1xuXG4iXX0=
(4)
});
