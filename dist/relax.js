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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvc3JjL0RlbHRhLmpzIiwiL2hvbWUvdG9ueWcvZGV2L2NkZy9yZWxheC9zcmMvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvc3JjL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcyIsIi9ob21lL3RvbnlnL2Rldi9jZGcvcmVsYXgvc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gRGVsdGEob2JqKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIl9vYmpcIiwgeyB2YWx1ZTogb2JqIH0pO1xufTtcblxuRGVsdGEucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ocmhvKSB7XG4gIGZvciAodmFyIHAgaW4gdGhpcykge1xuICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICB0aGlzLl9vYmpbcF0gKz0gdGhpc1twXSAqIHJobztcbiAgICAgIHRoaXNbcF0gPSAwO1xuICAgIH1cbiAgfVxufTtcblxuRGVsdGEucHJvdG90eXBlLmlzU2lnbmlmaWNhbnQgPSBmdW5jdGlvbihlcHNpbG9uKSB7XG4gIGZvciAodmFyIHAgaW4gdGhpcykge1xuICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KHApICYmIE1hdGguYWJzKHRoaXNbcF0pID4gZXBzaWxvbikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGVsdGE7XG5cbiIsImZ1bmN0aW9uIGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHMoUmVsYXgpIHtcblxuICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBhcml0aG1ldGljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgLy8gYXJiaXRyYXJ5IHByb3BlcnRpZXMgb2YgYXJiaXRyYXJ5IG9iamVjdHMuIFwiUmVmZXJlbmNlc1wiIGFyZSByZXByZXNlbnRlZFxuICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gIFJlbGF4LmFyaXRoID0ge307XG5cbiAgLy8gVmFsdWUgQ29uc3RyYWludCwgaS5lLiwgby5wID0gdmFsdWVcblxuICBSZWxheC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihyZWYsIHZhbHVlKSB7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuZE9iaiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihyZWYub2JqKTtcbiAgfVxuXG4gIFJlbGF4LmFyaXRoLlZhbHVlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB0aGlzLmRPYmpbdGhpcy5yZWYucHJvcF0gPSB0aGlzLnZhbHVlIC0gdGhpcy5yZWYub2JqW3RoaXMucmVmLnByb3BdO1xuICB9O1xuXG4gIC8vIEVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIG8xLnAxID0gbzIucDJcblxuICBSZWxheC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbihyZWYxLCByZWYyKSB7XG4gICAgdGhpcy5yZWYxID0gcmVmMTtcbiAgICB0aGlzLnJlZjIgPSByZWYyO1xuICAgIHRoaXMuZE9iajEgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMS5vYmopO1xuICAgIHRoaXMuZE9iajIgPSBSZWxheC5tYWtlRGVsdGFGb3IocmVmMi5vYmopO1xuICB9XG5cbiAgUmVsYXguYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBkaWZmID0gdGhpcy5yZWYxLm9ialt0aGlzLnJlZjEucHJvcF0gLSB0aGlzLnJlZjIub2JqW3RoaXMucmVmMi5wcm9wXTtcbiAgICB0aGlzLmRPYmoxW3RoaXMucmVmMS5wcm9wXSA9IC1kaWZmIC8gMjtcbiAgICB0aGlzLmRPYmoyW3RoaXMucmVmMi5wcm9wXSA9ICtkaWZmIC8gMjtcbiAgfTtcblxuICAvLyBTdW0gQ29uc3RyYWludCwgaS5lLiwgbzEucDEgKyBvMi5wMiA9IG8zLnAzXG5cbiAgUmVsYXguYXJpdGguU3VtQ29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZjEsIHJlZjIsIHJlZjMpIHtcbiAgICB0aGlzLnJlZjEgPSByZWYxO1xuICAgIHRoaXMucmVmMiA9IHJlZjI7XG4gICAgdGhpcy5yZWYzID0gcmVmMztcbiAgICB0aGlzLmRPYmoxID0gUmVsYXgubWFrZURlbHRhRm9yKHJlZjEub2JqKTtcbiAgICB0aGlzLmRPYmoyID0gUmVsYXgubWFrZURlbHRhRm9yKHJlZjIub2JqKTtcbiAgICB0aGlzLmRPYmozID0gUmVsYXgubWFrZURlbHRhRm9yKHJlZjMub2JqKTtcbiAgfVxuXG4gIFJlbGF4LmFyaXRoLlN1bUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGRpZmYgPSB0aGlzLnJlZjMub2JqW3RoaXMucmVmMy5wcm9wXSAtICh0aGlzLnJlZjEub2JqW3RoaXMucmVmMS5wcm9wXSArIHRoaXMucmVmMi5vYmpbdGhpcy5yZWYyLnByb3BdKTtcbiAgICB0aGlzLmRPYmoxW3RoaXMucmVmMS5wcm9wXSA9ICtkaWZmIC8gMztcbiAgICB0aGlzLmRPYmoyW3RoaXMucmVmMi5wcm9wXSA9ICtkaWZmIC8gMztcbiAgICB0aGlzLmRPYmozW3RoaXMucmVmMy5wcm9wXSA9IC1kaWZmIC8gMztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHM7XG4iLCJmdW5jdGlvbiBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoUmVsYXgpIHtcblxuICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBnZW9tZXRyaWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAvLyBvYmplY3RzIHRoYXQgaGF2ZSB4IGFuZCB5IHByb3BlcnRpZXMuIE90aGVyIHByb3BlcnRpZXMgYXJlIGlnbm9yZWQuXG5cbiAgUmVsYXguZ2VvbSA9IHt9O1xuXG4gIC8vIEhlbHBlcnNcblxuICBmdW5jdGlvbiBzcXVhcmUobikge1xuICAgIHJldHVybiBuICogbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBsdXMocDEsIHAyKSB7XG4gICAgcmV0dXJuIHt4OiBwMS54ICsgcDIueCwgeTogcDEueSArIHAyLnl9O1xuICB9XG5cbiAgZnVuY3Rpb24gbWludXMocDEsIHAyKSB7XG4gICAgcmV0dXJuIHt4OiBwMS54IC0gcDIueCwgeTogcDEueSAtIHAyLnl9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuICAgIHJldHVybiB7eDogcC54ICogbSwgeTogcC55ICogbX07XG4gIH1cblxuICBmdW5jdGlvbiBjb3B5KHApIHtcbiAgICByZXR1cm4gc2NhbGVkQnkocCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcbiAgICByZXR1cm4gc2NhbGVkQnkocGx1cyhwMSwgcDIpLCAwLjUpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFnbml0dWRlKHApIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwLngpICsgc3F1YXJlKHAueSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplZChwKSB7XG4gICAgcmV0dXJuIHNjYWxlZEJ5KHAsIDEgLyBtYWduaXR1ZGUocCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcm90YXRlZEJ5KHAsIGRUaGV0YSkge1xuICAgIHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKTtcbiAgICB2YXIgcyA9IE1hdGguc2luKGRUaGV0YSk7XG4gICAgcmV0dXJuIHt4OiBjKnAueCAtIHMqcC55LCB5OiBzKnAueCArIGMqcC55fTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJvdGF0ZWRBcm91bmQocCwgZFRoZXRhLCBheGlzKSB7XG4gICAgcmV0dXJuIHBsdXMoYXhpcywgcm90YXRlZEJ5KG1pbnVzKHAsIGF4aXMpLCBkVGhldGEpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERlbHRhKGQsIHAsIHNjYWxlKSB7XG4gICAgZC54ID0gcC54ICogc2NhbGU7XG4gICAgZC55ID0gcC55ICogc2NhbGU7XG4gIH1cblxuICBSZWxheC5nZW9tLnNxdWFyZSA9IHNxdWFyZTtcbiAgUmVsYXguZ2VvbS5wbHVzID0gcGx1cztcbiAgUmVsYXguZ2VvbS5taW51cyA9IG1pbnVzO1xuICBSZWxheC5nZW9tLnNjYWxlZEJ5ID0gc2NhbGVkQnk7XG4gIFJlbGF4Lmdlb20uY29weSA9IGNvcHk7XG4gIFJlbGF4Lmdlb20ubWlkcG9pbnQgPSBtaWRwb2ludDtcbiAgUmVsYXguZ2VvbS5tYWduaXR1ZGUgPSBtYWduaXR1ZGU7XG4gIFJlbGF4Lmdlb20ubm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQ7XG4gIFJlbGF4Lmdlb20ucm90YXRlZEJ5ID0gcm90YXRlZEJ5O1xuICBSZWxheC5nZW9tLnJvdGF0ZWRBcm91bmQgPSByb3RhdGVkQXJvdW5kO1xuICBSZWxheC5nZW9tLnNldERlbHRhID0gc2V0RGVsdGE7XG5cbiAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICBSZWxheC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24ocCwgeCwgeSkge1xuICAgIHRoaXMucCA9IHA7XG4gICAgdGhpcy5jID0ge3g6IHgsIHk6IHl9O1xuICAgIHRoaXMuZFAgPSBSZWxheC5tYWtlRGVsdGFGb3IocCk7XG4gIH1cblxuICBSZWxheC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBkaWZmID0gbWludXModGhpcy5jLCB0aGlzLnApO1xuICAgIHRoaXMuZFAueCA9IGRpZmYueDtcbiAgICB0aGlzLmRQLnkgPSBkaWZmLnk7XG4gIH07XG5cbiAgLy8gQ29pbmNpZGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZXNlIHR3byBwb2ludHMgdG8gYmUgYXQgdGhlIHNhbWUgcGxhY2UuXG5cbiAgUmVsYXguZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMuZFAxID0gUmVsYXgubWFrZURlbHRhRm9yKHAxKTtcbiAgICB0aGlzLmRQMiA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMik7XG4gIH1cblxuICBSZWxheC5nZW9tLkNvaW5jaWRlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXModGhpcy5wMiwgdGhpcy5wMSksIDAuNSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDEsIHNwbGl0RGlmZiwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAyLCBzcGxpdERpZmYsIC0xKTtcbiAgfTtcblxuICAvLyBFcXVpdmFsZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlIHZlY3RvcnMgcDEtPnAyIGFuZCBwMy0+cDQgdG8gYmUgdGhlIHNhbWUuXG5cbiAgUmVsYXguZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgICB0aGlzLmRQMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMSk7XG4gICAgdGhpcy5kUDIgPSBSZWxheC5tYWtlRGVsdGFGb3IocDIpO1xuICAgIHRoaXMuZFAzID0gUmVsYXgubWFrZURlbHRhRm9yKHAzKTtcbiAgICB0aGlzLmRQNCA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwNCk7XG4gIH1cblxuICBSZWxheC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuMjUpO1xuICAgIHNldERlbHRhKHRoaXMuZFAxLCBzcGxpdERpZmYsICsxKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMiwgc3BsaXREaWZmLCAtMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDMsIHNwbGl0RGlmZiwgLTEpO1xuICAgIHNldERlbHRhKHRoaXMuZFA0LCBzcGxpdERpZmYsICsxKTtcbiAgfTtcblxuICAvLyBFcXVhbCBEaXN0YW5jZSBjb25zdHJhaW50IC0ga2VlcHMgZGlzdGFuY2VzIFAxLS0+UDIsIFAzLS0+UDQgZXF1YWxcblxuICBSZWxheC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMucDMgPSBwMztcbiAgICB0aGlzLnA0ID0gcDQ7XG4gICAgdGhpcy5kUDEgPSBSZWxheC5tYWtlRGVsdGFGb3IocDEpO1xuICAgIHRoaXMuZFAyID0gUmVsYXgubWFrZURlbHRhRm9yKHAyKTtcbiAgICB0aGlzLmRQMyA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMyk7XG4gICAgdGhpcy5kUDQgPSBSZWxheC5tYWtlRGVsdGFGb3IocDQpO1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSk7XG4gICAgdmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSk7XG4gICAgdmFyIGRlbHRhID0gKGwxMiAtIGwzNCkgLyA0O1xuICAgIHZhciBlMTIgPSBzY2FsZWRCeShub3JtYWxpemVkKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKSwgZGVsdGEpO1xuICAgIHZhciBlMzQgPSBzY2FsZWRCeShub3JtYWxpemVkKG1pbnVzKHRoaXMucDQsIHRoaXMucDMpKSwgZGVsdGEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAxLCBlMTIsICsxKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMiwgZTEyLCAtMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDMsIGUzNCwgLTEpO1xuICAgIHNldERlbHRhKHRoaXMuZFA0LCBlMzQsICsxKTtcbiAgfTtcblxuICAvLyBMZW5ndGggY29uc3RyYWludCAtIG1haW50YWlucyBkaXN0YW5jZSBiZXR3ZWVuIFAxIGFuZCBQMiBhdCBMLlxuXG4gIFJlbGF4Lmdlb20uTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgbCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5sID0gbDtcbiAgICB0aGlzLmRQMSA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMSk7XG4gICAgdGhpcy5kUDIgPSBSZWxheC5tYWtlRGVsdGFGb3IocDIpO1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKTtcbiAgICB2YXIgZGVsdGEgPSAobDEyIC0gdGhpcy5sKSAvIDI7XG4gICAgdmFyIGUxMiA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQobWludXModGhpcy5wMiwgdGhpcy5wMSkpLCBkZWx0YSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDEsIGUxMiwgKzEpO1xuICAgIHNldERlbHRhKHRoaXMuZFAyLCBlMTIsIC0xKTtcbiAgfTtcblxuICAvLyBPcmllbnRhdGlvbiBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGFcblxuICBSZWxheC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0LCB0aGV0YSkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgICB0aGlzLnRoZXRhID0gdGhldGE7XG4gICAgdGhpcy5kUDEgPSBSZWxheC5tYWtlRGVsdGFGb3IocDEpO1xuICAgIHRoaXMuZFAyID0gUmVsYXgubWFrZURlbHRhRm9yKHAyKTtcbiAgICB0aGlzLmRQMyA9IFJlbGF4Lm1ha2VEZWx0YUZvcihwMyk7XG4gICAgdGhpcy5kUDQgPSBSZWxheC5tYWtlRGVsdGFGb3IocDQpO1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciB2MTIgPSBtaW51cyh0aGlzLnAyLCB0aGlzLnAxKTtcbiAgICB2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpO1xuICAgIHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKTtcblxuICAgIHZhciB2MzQgPSBtaW51cyh0aGlzLnA0LCB0aGlzLnAzKTtcbiAgICB2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpO1xuICAgIHZhciBtMzQgPSBtaWRwb2ludCh0aGlzLnAzLCB0aGlzLnA0KTtcblxuICAgIHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzQ7XG4gICAgdmFyIGRUaGV0YSA9IHRoaXMudGhldGEgLSBjdXJyVGhldGE7XG4gICAgLy8gVE9ETzogZmlndXJlIG91dCB3aHkgc2V0dGluZyBkVGhldGEgdG8gMS8yIHRpbWVzIHRoaXMgdmFsdWUgKGFzIHNob3duIGluIHRoZSBwYXBlclxuICAgIC8vIGFuZCBzZWVtcyB0byBtYWtlIHNlbnNlKSByZXN1bHRzIGluIGp1bXB5L3Vuc3RhYmxlIGJlaGF2aW9yLlxuICAgIFxuICAgIHNldERlbHRhKHRoaXMuZFAxLCBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMSksICsxKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMiwgbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMiksIHRoaXMucDIpLCArMSk7XG4gICAgc2V0RGVsdGEodGhpcy5kUDMsIG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wMywgLWRUaGV0YSwgbTM0KSwgdGhpcy5wMyksICsxKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQNCwgbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnA0LCAtZFRoZXRhLCBtMzQpLCB0aGlzLnA0KSwgKzEpO1xuICB9O1xuXG4gIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAvLyB3IGlzIGluIHVuaXRzIG9mIEh6IC0gd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXG5cbiAgUmVsYXguZ2VvbS5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHcpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMudyA9IHc7XG4gICAgdGhpcy5sYXN0VCA9IERhdGUubm93KCk7XG4gICAgdGhpcy5kUDEgPSBSZWxheC5tYWtlRGVsdGFGb3IocDEpO1xuICAgIHRoaXMuZFAyID0gUmVsYXgubWFrZURlbHRhRm9yKHAyKTtcbiAgfTtcblxuICBSZWxheC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgdCA9ICh0aW1lTWlsbGlzIC0gdGhpcy5sYXN0VCkgLyAxMDAwLjA7IC8vIHQgaXMgdGltZSBkZWx0YSBpbiAqc2Vjb25kcypcbiAgICB2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqICgyICogTWF0aC5QSSk7XG4gICAgdmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpO1xuICAgIHNldERlbHRhKHRoaXMuZFAxLCBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMSksICsxKTtcbiAgICBzZXREZWx0YSh0aGlzLmRQMiwgbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMiksIHRoaXMucDIpLCArMSk7XG4gICAgdGhpcy5sYXN0VCA9IHRpbWVNaWxsaXM7XG4gIH07XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5tb2R1bGUuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzO1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBEZWx0YSA9IHJlcXVpcmUoJy4vRGVsdGEuanMnKTtcbnZhciBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9hcml0aG1ldGljLWNvbnN0cmFpbnRzLmpzJykuaW5zdGFsbDtcbnZhciBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMgPSByZXF1aXJlKCcuL2dlb21ldHJpYy1jb25zdHJhaW50cy5qcycpLmluc3RhbGw7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQdWJsaWNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIFJlbGF4KCkge1xuICB0aGlzLnJobyA9IDAuMjU7XG4gIHRoaXMuZXBzaWxvbiA9IDAuMDE7XG4gIHRoaXMudGhpbmdzID0gW107XG59XG5cblJlbGF4Lm1ha2VEZWx0YUZvciA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gbmV3IERlbHRhKG9iaik7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odGhpbmcpIHtcbiAgdGhpcy50aGluZ3MucHVzaCh0aGluZyk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24odW53YW50ZWRUaGluZykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMudGhpbmdzID0gdGhpcy50aGluZ3MuZmlsdGVyKGZ1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaW5nICE9PSB1bndhbnRlZFRoaW5nICYmXG4gICAgICAgICAgICEoaXNDb25zdHJhaW50KHRoaW5nKSAmJiBpbnZvbHZlcyh0aGluZywgdW53YW50ZWRUaGluZykpO1xuICB9KTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5kb09uZUl0ZXJhdGlvbiA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgaWYgKHRoaXMuYmVmb3JlRWFjaEl0ZXJhdGlvbikge1xuICAgICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pKCk7XG4gIH1cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgZGlkU29tZXRoaW5nID0gZmFsc2U7XG4gIHRoaXMudGhpbmdzLmZvckVhY2goZnVuY3Rpb24oYykge1xuICAgIGlmIChpc0NvbnN0cmFpbnQoYykpIHtcbiAgICAgIGMuY29tcHV0ZURlbHRhcyh0aW1lTWlsbGlzKTtcbiAgICAgIGRpZFNvbWV0aGluZyA9IGRpZFNvbWV0aGluZyB8fCBoYXNTaWduaWZpY2FudERlbHRhcyhzZWxmLCBjKTtcbiAgICB9XG4gIH0pO1xuICBpZiAoZGlkU29tZXRoaW5nKSB7XG4gICAgdGhpcy50aGluZ3MuZm9yRWFjaChmdW5jdGlvbihjKSB7XG4gICAgICBpZiAoaXNDb25zdHJhaW50KGMpKSB7XG4gICAgICAgIGFwcGx5RGVsdGFzKHNlbGYsIGMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiBkaWRTb21ldGhpbmc7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuaXRlcmF0ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIHZhciBkaWRTb21ldGhpbmc7XG4gIHZhciBub3csIHQwLCB0O1xuICBub3cgPSB0MCA9IERhdGUubm93KCk7XG4gIGRvIHtcbiAgICBkaWRTb21ldGhpbmcgPSB0aGlzLmRvT25lSXRlcmF0aW9uKG5vdyk7XG4gICAgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB0ID0gbm93IC0gdDA7XG4gICAgY291bnQgKz0gZGlkU29tZXRoaW5nID8gMSA6IDA7XG4gIH0gd2hpbGUgKGRpZFNvbWV0aGluZyAmJiB0IDwgdE1pbGxpcyk7XG4gIHJldHVybiBjb3VudDtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBpc0NvbnN0cmFpbnQodGhpbmcpIHtcbiAgcmV0dXJuIHRoaW5nLmNvbXB1dGVEZWx0YXMgIT09IHVuZGVmaW5lZDtcbn07XG5cbmZ1bmN0aW9uIGhhc1NpZ25pZmljYW50RGVsdGFzKHJlbGF4LCBjb25zdHJhaW50KSB7XG4gIGZvciAodmFyIHAgaW4gY29uc3RyYWludCkge1xuICAgIHZhciBkID0gY29uc3RyYWludFtwXTtcbiAgICBpZiAoZCBpbnN0YW5jZW9mIERlbHRhICYmIGQuaXNTaWduaWZpY2FudChyZWxheC5lcHNpbG9uKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIGFwcGx5RGVsdGFzKHJlbGF4LCBjb25zdHJhaW50KSB7XG4gIGZvciAodmFyIHAgaW4gY29uc3RyYWludCkge1xuICAgIHZhciBkID0gY29uc3RyYWludFtwXTtcbiAgICBpZiAoZCBpbnN0YW5jZW9mIERlbHRhKSB7XG4gICAgICBkLmFwcGx5KHJlbGF4LnJobyk7XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBpbnZvbHZlcyhjb25zdHJhaW50LCBvYmopIHtcbiAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG4gICAgdmFyIGQgPSBjb25zdHJhaW50W3BdO1xuICAgIGlmIChkIGluc3RhbmNlb2YgRGVsdGEgJiYgZC5fb2JqID09PSBvYmopIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW5zdGFsbCBjb25zdHJhaW50IGxpYnJhcmllc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyhSZWxheCk7XG5pbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoUmVsYXgpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWxheDtcblxuIl19
(4)
});
