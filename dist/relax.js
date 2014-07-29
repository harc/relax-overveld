!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Relax=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

module.exports.install = installArithmeticConstraints;

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
    return scaledBy(p, 1);
  }

  function midpoint(p1, p2) {
    return scaledBy(plus(p1, p2), 0.5);
  }

  function magnitude(p) {
    return Math.sqrt(square(p.x) + square(p.y));
  }

  function normalized(p) {
    return scaledBy(p, 1 / magnitude(p));
  }

  function rotatedBy(p, dTheta) {
    var c = Math.cos(dTheta);
    var s = Math.sin(dTheta);
    return {x: c*p.x - s*p.y, y: s*p.x + c*p.y};
  }

  function rotatedAround(p, dTheta, axis) {
    return plus(axis, rotatedBy(minus(p, axis), dTheta));
  }

  function setDelta(d, p, scale) {
    d.x = p.x * scale;
    d.y = p.y * scale;
  }

  Relax.geom.square = square;
  Relax.geom.plus = plus;
  Relax.geom.minus = minus;
  Relax.geom.scaledBy = scaledBy;
  Relax.geom.copy = copy;
  Relax.geom.midpoint = midpoint;
  Relax.geom.magnitude = magnitude;
  Relax.geom.normalized = normalized;
  Relax.geom.rotatedBy = rotatedBy;
  Relax.geom.rotatedAround = rotatedAround;
  Relax.geom.setDelta = setDelta;

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
    setDelta(this.dP1, splitDiff, +1);
    setDelta(this.dP2, splitDiff, -1);
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
    setDelta(this.dP1, splitDiff, +1);
    setDelta(this.dP2, splitDiff, -1);
    setDelta(this.dP3, splitDiff, -1);
    setDelta(this.dP4, splitDiff, +1);
  };

  // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

  Relax.geom.EqualDistanceConstraint = function(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
    this.dP3 = Relax.makeDeltaFor(p3);
    this.dP4 = Relax.makeDeltaFor(p4);
  };

  Relax.geom.EqualDistanceConstraint.prototype.computeDeltas = function(timeMillis) {
    var l12 = magnitude(minus(this.p1, this.p2));
    var l34 = magnitude(minus(this.p3, this.p4));
    var delta = (l12 - l34) / 4;
    var e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
    var e34 = scaledBy(normalized(minus(this.p4, this.p3)), delta);
    setDelta(this.dP1, e12, +1);
    setDelta(this.dP2, e12, -1);
    setDelta(this.dP3, e34, -1);
    setDelta(this.dP4, e34, +1);
  };

  // Length constraint - maintains distance between P1 and P2 at L.

  Relax.geom.LengthConstraint = function(p1, p2, l) {
    this.p1 = p1;
    this.p2 = p2;
    this.l = l;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
  };

  Relax.geom.LengthConstraint.prototype.computeDeltas = function(timeMillis) {
    var l12 = magnitude(minus(this.p1, this.p2));
    var delta = (l12 - this.l) / 2;
    var e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
    setDelta(this.dP1, e12, +1);
    setDelta(this.dP2, e12, -1);
  };

  // Orientation constraint - maintains angle between P1->P2 and P3->P4 at Theta

  Relax.geom.OrientationConstraint = function(p1, p2, p3, p4, theta) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.theta = theta;
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
    this.dP3 = Relax.makeDeltaFor(p3);
    this.dP4 = Relax.makeDeltaFor(p4);
  };

  Relax.geom.OrientationConstraint.prototype.computeDeltas = function(timeMillis) {
    var v12 = minus(this.p2, this.p1);
    var a12 = Math.atan2(v12.y, v12.x);
    var m12 = midpoint(this.p1, this.p2);

    var v34 = minus(this.p4, this.p3);
    var a34 = Math.atan2(v34.y, v34.x);
    var m34 = midpoint(this.p3, this.p4);

    var currTheta = a12 - a34;
    var dTheta = this.theta - currTheta;
    // TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
    // and seems to make sense) results in jumpy/unstable behavior.
    
    setDelta(this.dP1, minus(rotatedAround(this.p1, dTheta, m12), this.p1), +1);
    setDelta(this.dP2, minus(rotatedAround(this.p2, dTheta, m12), this.p2), +1);
    setDelta(this.dP3, minus(rotatedAround(this.p3, -dTheta, m34), this.p3), +1);
    setDelta(this.dP4, minus(rotatedAround(this.p4, -dTheta, m34), this.p4), +1);
  };

  // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
  // w is in units of Hz - whole rotations per second.

  Relax.geom.MotorConstraint = function(p1, p2, w) {
    this.p1 = p1;
    this.p2 = p2;
    this.w = w;
    this.lastT = Date.now();
    this.dP1 = Relax.makeDeltaFor(p1);
    this.dP2 = Relax.makeDeltaFor(p2);
  };

  Relax.geom.MotorConstraint.prototype.computeDeltas = function(timeMillis) {
    var t = (timeMillis - this.lastT) / 1000.0; // t is time delta in *seconds*
    var dTheta = t * this.w * (2 * Math.PI);
    var m12 = midpoint(this.p1, this.p2);
    setDelta(this.dP1, minus(rotatedAround(this.p1, dTheta, m12), this.p1), +1);
    setDelta(this.dP2, minus(rotatedAround(this.p2, dTheta, m12), this.p2), +1);
    this.lastT = timeMillis;
  };
}

///////////////////////////////////////////////////////////////////////////

module.exports.install = installGeometricConstraints;

},{}],4:[function(_dereq_,module,exports){
// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var Delta = _dereq_('./Delta.js');
var installArithmeticConstraints = _dereq_('./arithmetic-constraints.js').install;
var installGeometricConstraints = _dereq_('./geometric-constraints.js').install;

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
  return thing;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvc3JjL0RlbHRhLmpzIiwiL2hvbWUvdG9ueWcvZGV2L2NkZy9yZWxheC9zcmMvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvc3JjL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcyIsIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBEZWx0YShvYmopIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiX29ialwiLCB7IHZhbHVlOiBvYmogfSk7XG59O1xuXG5EZWx0YS5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihyaG8pIHtcbiAgZm9yICh2YXIgcCBpbiB0aGlzKSB7XG4gICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgIHRoaXMuX29ialtwXSArPSB0aGlzW3BdICogcmhvO1xuICAgICAgdGhpc1twXSA9IDA7XG4gICAgfVxuICB9XG59O1xuXG5EZWx0YS5wcm90b3R5cGUuaXNTaWduaWZpY2FudCA9IGZ1bmN0aW9uKGVwc2lsb24pIHtcbiAgZm9yICh2YXIgcCBpbiB0aGlzKSB7XG4gICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkocCkgJiYgTWF0aC5hYnModGhpc1twXSkgPiBlcHNpbG9uKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZWx0YTtcblxuIiwiZnVuY3Rpb24gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhSZWxheCkge1xuXG4gIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGFyaXRobWV0aWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAvLyBhcmJpdHJhcnkgcHJvcGVydGllcyBvZiBhcmJpdHJhcnkgb2JqZWN0cy4gXCJSZWZlcmVuY2VzXCIgYXJlIHJlcHJlc2VudGVkXG4gIC8vIGFzIChvYmplY3QsIHByb3BlcnR5TmFtZSkgdHVwbGVzLCBlLmcuLCB7b2JqOiB5b3VyTW9tLCBwcm9wOiAnd2VpZ2h0J30uXG5cbiAgUmVsYXguYXJpdGggPSB7fTtcblxuICAvLyBWYWx1ZSBDb25zdHJhaW50LCBpLmUuLCBvLnAgPSB2YWx1ZVxuXG4gIFJlbGF4LmFyaXRoLlZhbHVlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZiwgdmFsdWUpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5kT2JqID0gUmVsYXgubWFrZURlbHRhRm9yKHJlZi5vYmopO1xuICB9XG5cbiAgUmVsYXguYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHRoaXMuZE9ialt0aGlzLnJlZi5wcm9wXSA9IHRoaXMudmFsdWUgLSB0aGlzLnJlZi5vYmpbdGhpcy5yZWYucHJvcF07XG4gIH07XG5cbiAgLy8gRXF1YWxpdHkgQ29uc3RyYWludCwgaS5lLiwgbzEucDEgPSBvMi5wMlxuXG4gIFJlbGF4LmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZjEsIHJlZjIpIHtcbiAgICB0aGlzLnJlZjEgPSByZWYxO1xuICAgIHRoaXMucmVmMiA9IHJlZjI7XG4gICAgdGhpcy5kT2JqMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihyZWYxLm9iaik7XG4gICAgdGhpcy5kT2JqMiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihyZWYyLm9iaik7XG4gIH1cblxuICBSZWxheC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGRpZmYgPSB0aGlzLnJlZjEub2JqW3RoaXMucmVmMS5wcm9wXSAtIHRoaXMucmVmMi5vYmpbdGhpcy5yZWYyLnByb3BdO1xuICAgIHRoaXMuZE9iajFbdGhpcy5yZWYxLnByb3BdID0gLWRpZmYgLyAyO1xuICAgIHRoaXMuZE9iajJbdGhpcy5yZWYyLnByb3BdID0gK2RpZmYgLyAyO1xuICB9O1xuXG4gIC8vIFN1bSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSArIG8yLnAyID0gbzMucDNcblxuICBSZWxheC5hcml0aC5TdW1Db25zdHJhaW50ID0gZnVuY3Rpb24ocmVmMSwgcmVmMiwgcmVmMykge1xuICAgIHRoaXMucmVmMSA9IHJlZjE7XG4gICAgdGhpcy5yZWYyID0gcmVmMjtcbiAgICB0aGlzLnJlZjMgPSByZWYzO1xuICAgIHRoaXMuZE9iajEgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMS5vYmopO1xuICAgIHRoaXMuZE9iajIgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMi5vYmopO1xuICAgIHRoaXMuZE9iajMgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMy5vYmopO1xuICB9XG5cbiAgUmVsYXguYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgZGlmZiA9IHRoaXMucmVmMy5vYmpbdGhpcy5yZWYzLnByb3BdIC0gKHRoaXMucmVmMS5vYmpbdGhpcy5yZWYxLnByb3BdICsgdGhpcy5yZWYyLm9ialt0aGlzLnJlZjIucHJvcF0pO1xuICAgIHRoaXMuZE9iajFbdGhpcy5yZWYxLnByb3BdID0gK2RpZmYgLyAzO1xuICAgIHRoaXMuZE9iajJbdGhpcy5yZWYyLnByb3BdID0gK2RpZmYgLyAzO1xuICAgIHRoaXMuZE9iajNbdGhpcy5yZWYzLnByb3BdID0gLWRpZmYgLyAzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cztcbiIsImZ1bmN0aW9uIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhSZWxheCkge1xuXG4gIC8vIFRoaXMgaXMgYSBjb2xsZWN0aW9uIG9mIGdlb21ldHJpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gIC8vIG9iamVjdHMgdGhhdCBoYXZlIHggYW5kIHkgcHJvcGVydGllcy4gT3RoZXIgcHJvcGVydGllcyBhcmUgaWdub3JlZC5cblxuICBSZWxheC5nZW9tID0ge307XG5cbiAgLy8gSGVscGVyc1xuXG4gIGZ1bmN0aW9uIHNxdWFyZShuKSB7XG4gICAgcmV0dXJuIG4gKiBuO1xuICB9XG5cbiAgZnVuY3Rpb24gcGx1cyhwMSwgcDIpIHtcbiAgICByZXR1cm4ge3g6IHAxLnggKyBwMi54LCB5OiBwMS55ICsgcDIueX07XG4gIH1cblxuICBmdW5jdGlvbiBtaW51cyhwMSwgcDIpIHtcbiAgICByZXR1cm4ge3g6IHAxLnggLSBwMi54LCB5OiBwMS55IC0gcDIueX07XG4gIH1cblxuICBmdW5jdGlvbiBzY2FsZWRCeShwLCBtKSB7XG4gICAgcmV0dXJuIHt4OiBwLnggKiBtLCB5OiBwLnkgKiBtfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHkocCkge1xuICAgIHJldHVybiBzY2FsZWRCeShwLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1pZHBvaW50KHAxLCBwMikge1xuICAgIHJldHVybiBzY2FsZWRCeShwbHVzKHAxLCBwMiksIDAuNSk7XG4gIH1cblxuICBmdW5jdGlvbiBtYWduaXR1ZGUocCkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoc3F1YXJlKHAueCkgKyBzcXVhcmUocC55KSk7XG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVkKHApIHtcbiAgICByZXR1cm4gc2NhbGVkQnkocCwgMSAvIG1hZ25pdHVkZShwKSk7XG4gIH1cblxuICBmdW5jdGlvbiByb3RhdGVkQnkocCwgZFRoZXRhKSB7XG4gICAgdmFyIGMgPSBNYXRoLmNvcyhkVGhldGEpO1xuICAgIHZhciBzID0gTWF0aC5zaW4oZFRoZXRhKTtcbiAgICByZXR1cm4ge3g6IGMqcC54IC0gcypwLnksIHk6IHMqcC54ICsgYypwLnl9O1xuICB9XG5cbiAgZnVuY3Rpb24gcm90YXRlZEFyb3VuZChwLCBkVGhldGEsIGF4aXMpIHtcbiAgICByZXR1cm4gcGx1cyhheGlzLCByb3RhdGVkQnkobWludXMocCwgYXhpcyksIGRUaGV0YSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0RGVsdGEoZCwgcCwgc2NhbGUpIHtcbiAgICBkLnggPSBwLnggKiBzY2FsZTtcbiAgICBkLnkgPSBwLnkgKiBzY2FsZTtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uc3F1YXJlID0gc3F1YXJlO1xuICBSZWxheC5nZW9tLnBsdXMgPSBwbHVzO1xuICBSZWxheC5nZW9tLm1pbnVzID0gbWludXM7XG4gIFJlbGF4Lmdlb20uc2NhbGVkQnkgPSBzY2FsZWRCeTtcbiAgUmVsYXguZ2VvbS5jb3B5ID0gY29weTtcbiAgUmVsYXguZ2VvbS5taWRwb2ludCA9IG1pZHBvaW50O1xuICBSZWxheC5nZW9tLm1hZ25pdHVkZSA9IG1hZ25pdHVkZTtcbiAgUmVsYXguZ2VvbS5ub3JtYWxpemVkID0gbm9ybWFsaXplZDtcbiAgUmVsYXguZ2VvbS5yb3RhdGVkQnkgPSByb3RhdGVkQnk7XG4gIFJlbGF4Lmdlb20ucm90YXRlZEFyb3VuZCA9IHJvdGF0ZWRBcm91bmQ7XG4gIFJlbGF4Lmdlb20uc2V0RGVsdGEgPSBzZXREZWx0YTtcblxuICAvLyBDb29yZGluYXRlIENvbnN0cmFpbnQsIGkuZS4sIFwiSSB3YW50IHRoaXMgcG9pbnQgdG8gYmUgaGVyZVwiLlxuXG4gIFJlbGF4Lmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwLCB4LCB5KSB7XG4gICAgdGhpcy5wID0gcDtcbiAgICB0aGlzLmMgPSB7eDogeCwgeTogeX07XG4gICAgdGhpcy5kUCA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwKTtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGRpZmYgPSBtaW51cyh0aGlzLmMsIHRoaXMucCk7XG4gICAgdGhpcy5kUC54ID0gZGlmZi54O1xuICAgIHRoaXMuZFAueSA9IGRpZmYueTtcbiAgfTtcblxuICAvLyBDb2luY2lkZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlc2UgdHdvIHBvaW50cyB0byBiZSBhdCB0aGUgc2FtZSBwbGFjZS5cblxuICBSZWxheC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMikge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5kUDEgPSBSZWxheC5tYWtlRGVsdGFGb3IocDEpO1xuICAgIHRoaXMuZFAyID0gUmVsYXgubWFrZURlbHRhRm9yKHAyKTtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSwgMC41KTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMSwgc3BsaXREaWZmLCArMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDIsIHNwbGl0RGlmZiwgLTEpO1xuICB9O1xuXG4gIC8vIEVxdWl2YWxlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGUgdmVjdG9ycyBwMS0+cDIgYW5kIHAzLT5wNCB0byBiZSB0aGUgc2FtZS5cblxuICBSZWxheC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgdGhpcy5wMSA9IHAxO1xuICAgIHRoaXMucDIgPSBwMjtcbiAgICB0aGlzLnAzID0gcDM7XG4gICAgdGhpcy5wNCA9IHA0O1xuICAgIHRoaXMuZFAxID0gUmVsYXgubWFrZURlbHRhRm9yKHAxKTtcbiAgICB0aGlzLmRQMiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMik7XG4gICAgdGhpcy5kUDMgPSBSZWxheC5tYWtlRGVsdGFGb3IocDMpO1xuICAgIHRoaXMuZFA0ID0gUmVsYXgubWFrZURlbHRhRm9yKHA0KTtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSwgMC4yNSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDEsIHNwbGl0RGlmZiwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAyLCBzcGxpdERpZmYsIC0xKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMywgc3BsaXREaWZmLCAtMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDQsIHNwbGl0RGlmZiwgKzEpO1xuICB9O1xuXG4gIC8vIEVxdWFsIERpc3RhbmNlIGNvbnN0cmFpbnQgLSBrZWVwcyBkaXN0YW5jZXMgUDEtLT5QMiwgUDMtLT5QNCBlcXVhbFxuXG4gIFJlbGF4Lmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgICB0aGlzLmRQMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMSk7XG4gICAgdGhpcy5kUDIgPSBSZWxheC5tYWtlRGVsdGFGb3IocDIpO1xuICAgIHRoaXMuZFAzID0gUmVsYXgubWFrZURlbHRhRm9yKHAzKTtcbiAgICB0aGlzLmRQNCA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwNCk7XG4gIH07XG5cbiAgUmVsYXguZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKTtcbiAgICB2YXIgbDM0ID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDMsIHRoaXMucDQpKTtcbiAgICB2YXIgZGVsdGEgPSAobDEyIC0gbDM0KSAvIDQ7XG4gICAgdmFyIGUxMiA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQobWludXModGhpcy5wMiwgdGhpcy5wMSkpLCBkZWx0YSk7XG4gICAgdmFyIGUzNCA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQobWludXModGhpcy5wNCwgdGhpcy5wMykpLCBkZWx0YSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDEsIGUxMiwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAyLCBlMTIsIC0xKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMywgZTM0LCAtMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDQsIGUzNCwgKzEpO1xuICB9O1xuXG4gIC8vIExlbmd0aCBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGRpc3RhbmNlIGJldHdlZW4gUDEgYW5kIFAyIGF0IEwuXG5cbiAgUmVsYXguZ2VvbS5MZW5ndGhDb25zdHJhaW50ID0gZnVuY3Rpb24ocDEsIHAyLCBsKSB7XG4gICAgdGhpcy5wMSA9IHAxO1xuICAgIHRoaXMucDIgPSBwMjtcbiAgICB0aGlzLmwgPSBsO1xuICAgIHRoaXMuZFAxID0gUmVsYXgubWFrZURlbHRhRm9yKHAxKTtcbiAgICB0aGlzLmRQMiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMik7XG4gIH07XG5cbiAgUmVsYXguZ2VvbS5MZW5ndGhDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpO1xuICAgIHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gMjtcbiAgICB2YXIgZTEyID0gc2NhbGVkQnkobm9ybWFsaXplZChtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSksIGRlbHRhKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMSwgZTEyLCArMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDIsIGUxMiwgLTEpO1xuICB9O1xuXG4gIC8vIE9yaWVudGF0aW9uIGNvbnN0cmFpbnQgLSBtYWludGFpbnMgYW5nbGUgYmV0d2VlbiBQMS0+UDIgYW5kIFAzLT5QNCBhdCBUaGV0YVxuXG4gIFJlbGF4Lmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50ID0gZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQsIHRoZXRhKSB7XG4gICAgdGhpcy5wMSA9IHAxO1xuICAgIHRoaXMucDIgPSBwMjtcbiAgICB0aGlzLnAzID0gcDM7XG4gICAgdGhpcy5wNCA9IHA0O1xuICAgIHRoaXMudGhldGEgPSB0aGV0YTtcbiAgICB0aGlzLmRQMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMSk7XG4gICAgdGhpcy5kUDIgPSBSZWxheC5tYWtlRGVsdGFGb3IocDIpO1xuICAgIHRoaXMuZFAzID0gUmVsYXgubWFrZURlbHRhRm9yKHAzKTtcbiAgICB0aGlzLmRQNCA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwNCk7XG4gIH07XG5cbiAgUmVsYXguZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpO1xuICAgIHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueCk7XG4gICAgdmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpO1xuXG4gICAgdmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpO1xuICAgIHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueCk7XG4gICAgdmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpO1xuXG4gICAgdmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNDtcbiAgICB2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YTtcbiAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IHdoeSBzZXR0aW5nIGRUaGV0YSB0byAxLzIgdGltZXMgdGhpcyB2YWx1ZSAoYXMgc2hvd24gaW4gdGhlIHBhcGVyXG4gICAgLy8gYW5kIHNlZW1zIHRvIG1ha2Ugc2Vuc2UpIHJlc3VsdHMgaW4ganVtcHkvdW5zdGFibGUgYmVoYXZpb3IuXG4gICAgXG4gICAgc2V0RGVsdGEodGhpcy5kUDEsIG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLCB0aGlzLnAxKSwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAyLCBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMiksICsxKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMywgbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnAzLCAtZFRoZXRhLCBtMzQpLCB0aGlzLnAzKSwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFA0LCBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDQsIC1kVGhldGEsIG0zNCksIHRoaXMucDQpLCArMSk7XG4gIH07XG5cbiAgLy8gTW90b3IgY29uc3RyYWludCAtIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUuXG4gIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICBSZWxheC5nZW9tLk1vdG9yQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgdykge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy53ID0gdztcbiAgICB0aGlzLmxhc3RUID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmRQMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMSk7XG4gICAgdGhpcy5kUDIgPSBSZWxheC5tYWtlRGVsdGFGb3IocDIpO1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uTW90b3JDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciB0ID0gKHRpbWVNaWxsaXMgLSB0aGlzLmxhc3RUKSAvIDEwMDAuMDsgLy8gdCBpcyB0aW1lIGRlbHRhIGluICpzZWNvbmRzKlxuICAgIHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogKDIgKiBNYXRoLlBJKTtcbiAgICB2YXIgbTEyID0gbWlkcG9pbnQodGhpcy5wMSwgdGhpcy5wMik7XG4gICAgc2V0RGVsdGEodGhpcy5kUDEsIG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLCB0aGlzLnAxKSwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAyLCBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMiksICsxKTtcbiAgICB0aGlzLmxhc3RUID0gdGltZU1pbGxpcztcbiAgfTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbm1vZHVsZS5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHM7XG4iLCIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW1wb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxudmFyIERlbHRhID0gcmVxdWlyZSgnLi9EZWx0YS5qcycpO1xudmFyIGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuL2FyaXRobWV0aWMtY29uc3RyYWludHMuanMnKS5pbnN0YWxsO1xudmFyIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vZ2VvbWV0cmljLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbDtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gUmVsYXgoKSB7XG4gIHRoaXMucmhvID0gMC4yNTtcbiAgdGhpcy5lcHNpbG9uID0gMC4wMTtcbiAgdGhpcy50aGluZ3MgPSBbXTtcbn1cblxuUmVsYXgubWFrZURlbHRhRm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiBuZXcgRGVsdGEob2JqKTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih0aGluZykge1xuICB0aGlzLnRoaW5ncy5wdXNoKHRoaW5nKTtcbiAgcmV0dXJuIHRoaW5nO1xufTtcblxuUmVsYXgucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHVud2FudGVkVGhpbmcpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnRoaW5ncyA9IHRoaXMudGhpbmdzLmZpbHRlcihmdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0aGluZyAhPT0gdW53YW50ZWRUaGluZyAmJlxuICAgICAgICAgICAhKGlzQ29uc3RyYWludCh0aGluZykgJiYgaW52b2x2ZXModGhpbmcsIHVud2FudGVkVGhpbmcpKTtcbiAgfSk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gIGlmICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pIHtcbiAgICAodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKSgpO1xuICB9XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRpZFNvbWV0aGluZyA9IGZhbHNlO1xuICB0aGlzLnRoaW5ncy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcbiAgICBpZiAoaXNDb25zdHJhaW50KGMpKSB7XG4gICAgICBjLmNvbXB1dGVEZWx0YXModGltZU1pbGxpcyk7XG4gICAgICBkaWRTb21ldGhpbmcgPSBkaWRTb21ldGhpbmcgfHwgaGFzU2lnbmlmaWNhbnREZWx0YXMoc2VsZiwgYyk7XG4gICAgfVxuICB9KTtcbiAgaWYgKGRpZFNvbWV0aGluZykge1xuICAgIHRoaXMudGhpbmdzLmZvckVhY2goZnVuY3Rpb24oYykge1xuICAgICAgaWYgKGlzQ29uc3RyYWludChjKSkge1xuICAgICAgICBhcHBseURlbHRhcyhzZWxmLCBjKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZGlkU29tZXRoaW5nO1xufTtcblxuUmVsYXgucHJvdG90eXBlLml0ZXJhdGVGb3JVcFRvTWlsbGlzID0gZnVuY3Rpb24odE1pbGxpcykge1xuICB2YXIgY291bnQgPSAwO1xuICB2YXIgZGlkU29tZXRoaW5nO1xuICB2YXIgbm93LCB0MCwgdDtcbiAgbm93ID0gdDAgPSBEYXRlLm5vdygpO1xuICBkbyB7XG4gICAgZGlkU29tZXRoaW5nID0gdGhpcy5kb09uZUl0ZXJhdGlvbihub3cpO1xuICAgIG5vdyA9IERhdGUubm93KCk7XG4gICAgdCA9IG5vdyAtIHQwO1xuICAgIGNvdW50ICs9IGRpZFNvbWV0aGluZyA/IDEgOiAwO1xuICB9IHdoaWxlIChkaWRTb21ldGhpbmcgJiYgdCA8IHRNaWxsaXMpO1xuICByZXR1cm4gY291bnQ7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJpdmF0ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gaXNDb25zdHJhaW50KHRoaW5nKSB7XG4gIHJldHVybiB0aGluZy5jb21wdXRlRGVsdGFzICE9PSB1bmRlZmluZWQ7XG59O1xuXG5mdW5jdGlvbiBoYXNTaWduaWZpY2FudERlbHRhcyhyZWxheCwgY29uc3RyYWludCkge1xuICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcbiAgICB2YXIgZCA9IGNvbnN0cmFpbnRbcF07XG4gICAgaWYgKGQgaW5zdGFuY2VvZiBEZWx0YSAmJiBkLmlzU2lnbmlmaWNhbnQocmVsYXguZXBzaWxvbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5mdW5jdGlvbiBhcHBseURlbHRhcyhyZWxheCwgY29uc3RyYWludCkge1xuICBmb3IgKHZhciBwIGluIGNvbnN0cmFpbnQpIHtcbiAgICB2YXIgZCA9IGNvbnN0cmFpbnRbcF07XG4gICAgaWYgKGQgaW5zdGFuY2VvZiBEZWx0YSkge1xuICAgICAgZC5hcHBseShyZWxheC5yaG8pO1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gaW52b2x2ZXMoY29uc3RyYWludCwgb2JqKSB7XG4gIGZvciAodmFyIHAgaW4gY29uc3RyYWludCkge1xuICAgIHZhciBkID0gY29uc3RyYWludFtwXTtcbiAgICBpZiAoZCBpbnN0YW5jZW9mIERlbHRhICYmIGQuX29iaiA9PT0gb2JqKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEluc3RhbGwgY29uc3RyYWludCBsaWJyYXJpZXNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHMoUmVsYXgpO1xuaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzKFJlbGF4KTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEV4cG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0gUmVsYXg7XG5cbiJdfQ==
(4)
});
