!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Relax=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
function installArithmeticConstraints(Relax) {

  // This is a collection of arithmetic constraints that can be applied to
  // arbitrary properties of arbitrary objects. "References" are represented
  // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

  Relax.arith = {};

  // Helpers

  function installRef(target, ref, prefix) {
    target[prefix + '_obj'] = ref.obj;
    target[prefix + '_prop'] = ref.prop;
  }

  function ref(target, prefix) {
    return target[prefix + '_obj'][target[prefix + '_prop']];
  }

  function deltas(target /* , prefix, delta, ... */) {
    var result = {};
    for (var i = 1; i < arguments.length; i += 2) {
      var prefix = arguments[i];
      var delta = arguments[i+1];
      if (!isFinite(delta)) {
        continue;
      }
      var d = result[prefix + '_obj'];
      if (!d) {
	result[prefix + '_obj'] = d = {};
      }
      d[target[prefix + '_prop']] = delta;
    }
    return result;
  }

  // Value Constraint, i.e., o.p = value

  Relax.arith.ValueConstraint = function(ref, value) {
    installRef(this, ref, 'v');
    this.value = value;
  }

  Relax.arith.ValueConstraint.prototype.computeDeltas = function(timeMillis) {
    return deltas(this, 'v', this.value - ref(this, 'v'));
  };

  // Equality Constraint, i.e., o1.p1 = o2.p2

  Relax.arith.EqualityConstraint = function(ref1, ref2) {
    installRef(this, ref1, 'v1');
    installRef(this, ref2, 'v2');
  }

  Relax.arith.EqualityConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = ref(this, 'v1') - ref(this, 'v2');
    return deltas(this,
        'v1', -diff / 2,
        'v2', +diff / 2);
  };

  // Sum Constraint, i.e., o1.p1 + o2.p2 = o3.p3

  Relax.arith.SumConstraint = function(ref1, ref2, ref3) {
    installRef(this, ref1, 'v1');
    installRef(this, ref2, 'v2');
    installRef(this, ref3, 'v3');
  }

  Relax.arith.SumConstraint.prototype.computeDeltas = function(timeMillis) {
    var diff = ref(this, 'v3') - (ref(this, 'v1') + ref(this, 'v2'));
    return deltas(this,
        'v1', +diff / 3,
        'v2', +diff / 3,
        'v3', -diff / 3);
  };
}

module.exports = installArithmeticConstraints;


},{}],2:[function(_dereq_,module,exports){
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
  }

  Relax.geom.CoordinateConstraint.prototype.computeDeltas = function(timeMillis) {
    return {p: minus(this.c, this.p)};
  };

  // Coincidence Constraint, i.e., I want these two points to be at the same place.

  Relax.geom.CoincidenceConstraint = function(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  Relax.geom.CoincidenceConstraint.prototype.computeDeltas = function(timeMillis) {
    var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5);
    return {p1: splitDiff, p2: scaledBy(splitDiff, -1)};
  };

  // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

  Relax.geom.EquivalenceConstraint = function(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  Relax.geom.EquivalenceConstraint.prototype.computeDeltas = function(timeMillis) {
    var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25);
    return {p1: splitDiff,
	    p2: scaledBy(splitDiff, -1),
	    p3: scaledBy(splitDiff, -1),
	    p4: splitDiff};
  };

  // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

  Relax.geom.EqualDistanceConstraint = function(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  };

  Relax.geom.EqualDistanceConstraint.prototype.computeDeltas = function(timeMillis) {
    var l12 = magnitude(minus(this.p1, this.p2));
    var l34 = magnitude(minus(this.p3, this.p4));
    var delta = (l12 - l34) / 4;
    var e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
    var e34 = scaledBy(normalized(minus(this.p4, this.p3)), delta);
    return {p1: e12,
	    p2: scaledBy(e12, -1),
	    p3: scaledBy(e34, -1),
	    p4: e34};
  };

  // Length constraint - maintains distance between P1 and P2 at L.

  Relax.geom.LengthConstraint = function(p1, p2, l) {
    this.p1 = p1;
    this.p2 = p2;
    this.l = l;
  };

  Relax.geom.LengthConstraint.prototype.computeDeltas = function(timeMillis) {
    var l12 = magnitude(minus(this.p1, this.p2));
    var delta = (l12 - this.l) / 2;
    var e12 = scaledBy(normalized(minus(this.p2, this.p1)), delta);
    return {p1: e12,
	    p2: scaledBy(e12, -1)};
  };

  // Orientation constraint - maintains angle between P1->P2 and P3->P4 at Theta

  Relax.geom.OrientationConstraint = function(p1, p2, p3, p4, theta) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.theta = theta;
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

    return {p1: minus(rotatedAround(this.p1, dTheta, m12), this.p1),
	    p2: minus(rotatedAround(this.p2, dTheta, m12), this.p2),
	    p3: minus(rotatedAround(this.p3, -dTheta, m34), this.p3),
	    p4: minus(rotatedAround(this.p4, -dTheta, m34), this.p4)};
  };

  // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
  // w is in units of Hz - whole rotations per second.

  Relax.geom.MotorConstraint = function(p1, p2, w) {
    this.p1 = p1;
    this.p2 = p2;
    this.w = w;
    this.lastT = Date.now();
  };

  Relax.geom.MotorConstraint.prototype.computeDeltas = function(timeMillis) {
    var t = (timeMillis - this.lastT) / 1000.0; // t is time delta in *seconds*
    this.lastT = timeMillis;
    var dTheta = t * this.w * (2 * Math.PI);
    var m12 = midpoint(this.p1, this.p2);
    return {p1: minus(rotatedAround(this.p1, dTheta, m12), this.p1),
	    p2: minus(rotatedAround(this.p2, dTheta, m12), this.p2)};
  };
}

module.exports = installGeometricConstraints;


},{}],3:[function(_dereq_,module,exports){
// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

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

Relax.isConstraint = function(thing) {
  return thing.computeDeltas !== undefined;
};

Relax.prototype.add = function(thing) {
  this.things.push(thing);
  return thing;
};

Relax.prototype.remove = function(unwantedThing) {
  var self = this;
  this.things = this.things.filter(function(thing) {
    return thing !== unwantedThing &&
           !(Relax.isConstraint(thing) && involves(thing, unwantedThing));
  });
};

Relax.prototype.clear = function() {
  this.things = [];
};

Relax.prototype.getConstraints = function() {
  return this.things.filter(Relax.isConstraint);
};

Relax.prototype.doOneIteration = function(timeMillis) {
  if (this.beforeEachIteration) {
    (this.beforeEachIteration)();
  }

  var self = this;
  var allDeltas = [];

  // Compute deltas
  this.things.forEach(function(t) {
    if (Relax.isConstraint(t)) {
      var c = t;
      var deltas = c.computeDeltas(timeMillis);
      if (hasSignificantDeltas(self, deltas)) {
	allDeltas.push({constraint: c, deltas: deltas});
      }
    }
  });

  // Apply deltas
  // (This shouldn't be done in the loop above b/c that would affect the other delta computations.)
  allDeltas.forEach(function(d) {
    applyDeltas(self, d);
  });

  return allDeltas.length > 0;
};

Relax.prototype.iterateForUpToMillis = function(tMillis) {
  var count = 0;
  var didSomething;
  var now, t0, t;
  now = t0 = Date.now();
  do {
    didSomething = this.doOneIteration(t0);
    now = Date.now();
    t = now - t0;
    count += didSomething ? 1 : 0;
  } while (didSomething && t < tMillis);
  return count;
};

// --------------------------------------------------------------------
// Private
// --------------------------------------------------------------------

function hasSignificantDeltas(relax, deltas) {
  for (var p in deltas) {
    var d = deltas[p];
    for (var prop in d) {
      if (d.hasOwnProperty(prop) && Math.abs(d[prop]) > relax.epsilon) {
	return true;
      }
    }
  }
  return false;
};

function applyDeltas(relax, patch) {
  for (var p in patch.deltas) {
    var d = patch.deltas[p];
    for (var prop in d) {
      if (d.hasOwnProperty(prop)) {
	patch.constraint[p][prop] += d[prop] * relax.rho;
      }
    }
  }
};

function involves(constraint, obj) {
  for (var p in constraint) {
    if (constraint[p] === obj) {
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


},{"./arithmetic-constraints.js":1,"./geometric-constraints.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9pODI3MDMyL0NERy93aGl0ZWJvYXJkL3JlbGF4LW92ZXJ2ZWxkL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaTgyNzAzMi9DREcvd2hpdGVib2FyZC9yZWxheC1vdmVydmVsZC9zcmMvYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcyIsIi9Vc2Vycy9pODI3MDMyL0NERy93aGl0ZWJvYXJkL3JlbGF4LW92ZXJ2ZWxkL3NyYy9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvaTgyNzAzMi9DREcvd2hpdGVib2FyZC9yZWxheC1vdmVydmVsZC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIGluc3RhbGxBcml0aG1ldGljQ29uc3RyYWludHMoUmVsYXgpIHtcblxuICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBhcml0aG1ldGljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgLy8gYXJiaXRyYXJ5IHByb3BlcnRpZXMgb2YgYXJiaXRyYXJ5IG9iamVjdHMuIFwiUmVmZXJlbmNlc1wiIGFyZSByZXByZXNlbnRlZFxuICAvLyBhcyAob2JqZWN0LCBwcm9wZXJ0eU5hbWUpIHR1cGxlcywgZS5nLiwge29iajogeW91ck1vbSwgcHJvcDogJ3dlaWdodCd9LlxuXG4gIFJlbGF4LmFyaXRoID0ge307XG5cbiAgLy8gSGVscGVyc1xuXG4gIGZ1bmN0aW9uIGluc3RhbGxSZWYodGFyZ2V0LCByZWYsIHByZWZpeCkge1xuICAgIHRhcmdldFtwcmVmaXggKyAnX29iaiddID0gcmVmLm9iajtcbiAgICB0YXJnZXRbcHJlZml4ICsgJ19wcm9wJ10gPSByZWYucHJvcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZih0YXJnZXQsIHByZWZpeCkge1xuICAgIHJldHVybiB0YXJnZXRbcHJlZml4ICsgJ19vYmonXVt0YXJnZXRbcHJlZml4ICsgJ19wcm9wJ11dO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVsdGFzKHRhcmdldCAvKiAsIHByZWZpeCwgZGVsdGEsIC4uLiAqLykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIHByZWZpeCA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIHZhciBkZWx0YSA9IGFyZ3VtZW50c1tpKzFdO1xuICAgICAgaWYgKCFpc0Zpbml0ZShkZWx0YSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB2YXIgZCA9IHJlc3VsdFtwcmVmaXggKyAnX29iaiddO1xuICAgICAgaWYgKCFkKSB7XG5cdHJlc3VsdFtwcmVmaXggKyAnX29iaiddID0gZCA9IHt9O1xuICAgICAgfVxuICAgICAgZFt0YXJnZXRbcHJlZml4ICsgJ19wcm9wJ11dID0gZGVsdGE7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBWYWx1ZSBDb25zdHJhaW50LCBpLmUuLCBvLnAgPSB2YWx1ZVxuXG4gIFJlbGF4LmFyaXRoLlZhbHVlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZiwgdmFsdWUpIHtcbiAgICBpbnN0YWxsUmVmKHRoaXMsIHJlZiwgJ3YnKTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBSZWxheC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgcmV0dXJuIGRlbHRhcyh0aGlzLCAndicsIHRoaXMudmFsdWUgLSByZWYodGhpcywgJ3YnKSk7XG4gIH07XG5cbiAgLy8gRXF1YWxpdHkgQ29uc3RyYWludCwgaS5lLiwgbzEucDEgPSBvMi5wMlxuXG4gIFJlbGF4LmFyaXRoLkVxdWFsaXR5Q29uc3RyYWludCA9IGZ1bmN0aW9uKHJlZjEsIHJlZjIpIHtcbiAgICBpbnN0YWxsUmVmKHRoaXMsIHJlZjEsICd2MScpO1xuICAgIGluc3RhbGxSZWYodGhpcywgcmVmMiwgJ3YyJyk7XG4gIH1cblxuICBSZWxheC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGRpZmYgPSByZWYodGhpcywgJ3YxJykgLSByZWYodGhpcywgJ3YyJyk7XG4gICAgcmV0dXJuIGRlbHRhcyh0aGlzLFxuICAgICAgICAndjEnLCAtZGlmZiAvIDIsXG4gICAgICAgICd2MicsICtkaWZmIC8gMik7XG4gIH07XG5cbiAgLy8gU3VtIENvbnN0cmFpbnQsIGkuZS4sIG8xLnAxICsgbzIucDIgPSBvMy5wM1xuXG4gIFJlbGF4LmFyaXRoLlN1bUNvbnN0cmFpbnQgPSBmdW5jdGlvbihyZWYxLCByZWYyLCByZWYzKSB7XG4gICAgaW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKTtcbiAgICBpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpO1xuICAgIGluc3RhbGxSZWYodGhpcywgcmVmMywgJ3YzJyk7XG4gIH1cblxuICBSZWxheC5hcml0aC5TdW1Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBkaWZmID0gcmVmKHRoaXMsICd2MycpIC0gKHJlZih0aGlzLCAndjEnKSArIHJlZih0aGlzLCAndjInKSk7XG4gICAgcmV0dXJuIGRlbHRhcyh0aGlzLFxuICAgICAgICAndjEnLCArZGlmZiAvIDMsXG4gICAgICAgICd2MicsICtkaWZmIC8gMyxcbiAgICAgICAgJ3YzJywgLWRpZmYgLyAzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzO1xuXG4iLCJmdW5jdGlvbiBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHMoUmVsYXgpIHtcblxuICAvLyBUaGlzIGlzIGEgY29sbGVjdGlvbiBvZiBnZW9tZXRyaWMgY29uc3RyYWludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xuICAvLyBvYmplY3RzIHRoYXQgaGF2ZSB4IGFuZCB5IHByb3BlcnRpZXMuIE90aGVyIHByb3BlcnRpZXMgYXJlIGlnbm9yZWQuXG5cbiAgUmVsYXguZ2VvbSA9IHt9O1xuXG4gIC8vIEhlbHBlcnNcblxuICBmdW5jdGlvbiBzcXVhcmUobikge1xuICAgIHJldHVybiBuICogbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBsdXMocDEsIHAyKSB7XG4gICAgcmV0dXJuIHt4OiBwMS54ICsgcDIueCwgeTogcDEueSArIHAyLnl9O1xuICB9XG5cbiAgZnVuY3Rpb24gbWludXMocDEsIHAyKSB7XG4gICAgcmV0dXJuIHt4OiBwMS54IC0gcDIueCwgeTogcDEueSAtIHAyLnl9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhbGVkQnkocCwgbSkge1xuICAgIHJldHVybiB7eDogcC54ICogbSwgeTogcC55ICogbX07XG4gIH1cblxuICBmdW5jdGlvbiBjb3B5KHApIHtcbiAgICByZXR1cm4gc2NhbGVkQnkocCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiBtaWRwb2ludChwMSwgcDIpIHtcbiAgICByZXR1cm4gc2NhbGVkQnkocGx1cyhwMSwgcDIpLCAwLjUpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFnbml0dWRlKHApIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZShwLngpICsgc3F1YXJlKHAueSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplZChwKSB7XG4gICAgcmV0dXJuIHNjYWxlZEJ5KHAsIDEgLyBtYWduaXR1ZGUocCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcm90YXRlZEJ5KHAsIGRUaGV0YSkge1xuICAgIHZhciBjID0gTWF0aC5jb3MoZFRoZXRhKTtcbiAgICB2YXIgcyA9IE1hdGguc2luKGRUaGV0YSk7XG4gICAgcmV0dXJuIHt4OiBjKnAueCAtIHMqcC55LCB5OiBzKnAueCArIGMqcC55fTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJvdGF0ZWRBcm91bmQocCwgZFRoZXRhLCBheGlzKSB7XG4gICAgcmV0dXJuIHBsdXMoYXhpcywgcm90YXRlZEJ5KG1pbnVzKHAsIGF4aXMpLCBkVGhldGEpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERlbHRhKGQsIHAsIHNjYWxlKSB7XG4gICAgZC54ID0gcC54ICogc2NhbGU7XG4gICAgZC55ID0gcC55ICogc2NhbGU7XG4gIH1cblxuICBSZWxheC5nZW9tLnNxdWFyZSA9IHNxdWFyZTtcbiAgUmVsYXguZ2VvbS5wbHVzID0gcGx1cztcbiAgUmVsYXguZ2VvbS5taW51cyA9IG1pbnVzO1xuICBSZWxheC5nZW9tLnNjYWxlZEJ5ID0gc2NhbGVkQnk7XG4gIFJlbGF4Lmdlb20uY29weSA9IGNvcHk7XG4gIFJlbGF4Lmdlb20ubWlkcG9pbnQgPSBtaWRwb2ludDtcbiAgUmVsYXguZ2VvbS5tYWduaXR1ZGUgPSBtYWduaXR1ZGU7XG4gIFJlbGF4Lmdlb20ubm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQ7XG4gIFJlbGF4Lmdlb20ucm90YXRlZEJ5ID0gcm90YXRlZEJ5O1xuICBSZWxheC5nZW9tLnJvdGF0ZWRBcm91bmQgPSByb3RhdGVkQXJvdW5kO1xuICBSZWxheC5nZW9tLnNldERlbHRhID0gc2V0RGVsdGE7XG5cbiAgLy8gQ29vcmRpbmF0ZSBDb25zdHJhaW50LCBpLmUuLCBcIkkgd2FudCB0aGlzIHBvaW50IHRvIGJlIGhlcmVcIi5cblxuICBSZWxheC5nZW9tLkNvb3JkaW5hdGVDb25zdHJhaW50ID0gZnVuY3Rpb24ocCwgeCwgeSkge1xuICAgIHRoaXMucCA9IHA7XG4gICAgdGhpcy5jID0ge3g6IHgsIHk6IHl9O1xuICB9XG5cbiAgUmVsYXguZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICByZXR1cm4ge3A6IG1pbnVzKHRoaXMuYywgdGhpcy5wKX07XG4gIH07XG5cbiAgLy8gQ29pbmNpZGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZXNlIHR3byBwb2ludHMgdG8gYmUgYXQgdGhlIHNhbWUgcGxhY2UuXG5cbiAgUmVsYXguZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICB9XG5cbiAgUmVsYXguZ2VvbS5Db2luY2lkZW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIHNwbGl0RGlmZiA9IHNjYWxlZEJ5KG1pbnVzKHRoaXMucDIsIHRoaXMucDEpLCAwLjUpO1xuICAgIHJldHVybiB7cDE6IHNwbGl0RGlmZiwgcDI6IHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpfTtcbiAgfTtcblxuICAvLyBFcXVpdmFsZW5jZSBDb25zdHJhaW50LCBpLmUuLCBJIHdhbnQgdGhlIHZlY3RvcnMgcDEtPnAyIGFuZCBwMy0+cDQgdG8gYmUgdGhlIHNhbWUuXG5cbiAgUmVsYXguZ2VvbS5FcXVpdmFsZW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyhwbHVzKHRoaXMucDIsIHRoaXMucDMpLCBwbHVzKHRoaXMucDEsIHRoaXMucDQpKSwgMC4yNSk7XG4gICAgcmV0dXJuIHtwMTogc3BsaXREaWZmLFxuXHQgICAgcDI6IHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpLFxuXHQgICAgcDM6IHNjYWxlZEJ5KHNwbGl0RGlmZiwgLTEpLFxuXHQgICAgcDQ6IHNwbGl0RGlmZn07XG4gIH07XG5cbiAgLy8gRXF1YWwgRGlzdGFuY2UgY29uc3RyYWludCAtIGtlZXBzIGRpc3RhbmNlcyBQMS0tPlAyLCBQMy0tPlA0IGVxdWFsXG5cbiAgUmVsYXguZ2VvbS5FcXVhbERpc3RhbmNlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgdGhpcy5wMSA9IHAxO1xuICAgIHRoaXMucDIgPSBwMjtcbiAgICB0aGlzLnAzID0gcDM7XG4gICAgdGhpcy5wNCA9IHA0O1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSk7XG4gICAgdmFyIGwzNCA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAzLCB0aGlzLnA0KSk7XG4gICAgdmFyIGRlbHRhID0gKGwxMiAtIGwzNCkgLyA0O1xuICAgIHZhciBlMTIgPSBzY2FsZWRCeShub3JtYWxpemVkKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKSwgZGVsdGEpO1xuICAgIHZhciBlMzQgPSBzY2FsZWRCeShub3JtYWxpemVkKG1pbnVzKHRoaXMucDQsIHRoaXMucDMpKSwgZGVsdGEpO1xuICAgIHJldHVybiB7cDE6IGUxMixcblx0ICAgIHAyOiBzY2FsZWRCeShlMTIsIC0xKSxcblx0ICAgIHAzOiBzY2FsZWRCeShlMzQsIC0xKSxcblx0ICAgIHA0OiBlMzR9O1xuICB9O1xuXG4gIC8vIExlbmd0aCBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGRpc3RhbmNlIGJldHdlZW4gUDEgYW5kIFAyIGF0IEwuXG5cbiAgUmVsYXguZ2VvbS5MZW5ndGhDb25zdHJhaW50ID0gZnVuY3Rpb24ocDEsIHAyLCBsKSB7XG4gICAgdGhpcy5wMSA9IHAxO1xuICAgIHRoaXMucDIgPSBwMjtcbiAgICB0aGlzLmwgPSBsO1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uTGVuZ3RoQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgbDEyID0gbWFnbml0dWRlKG1pbnVzKHRoaXMucDEsIHRoaXMucDIpKTtcbiAgICB2YXIgZGVsdGEgPSAobDEyIC0gdGhpcy5sKSAvIDI7XG4gICAgdmFyIGUxMiA9IHNjYWxlZEJ5KG5vcm1hbGl6ZWQobWludXModGhpcy5wMiwgdGhpcy5wMSkpLCBkZWx0YSk7XG4gICAgcmV0dXJuIHtwMTogZTEyLFxuXHQgICAgcDI6IHNjYWxlZEJ5KGUxMiwgLTEpfTtcbiAgfTtcblxuICAvLyBPcmllbnRhdGlvbiBjb25zdHJhaW50IC0gbWFpbnRhaW5zIGFuZ2xlIGJldHdlZW4gUDEtPlAyIGFuZCBQMy0+UDQgYXQgVGhldGFcblxuICBSZWxheC5nZW9tLk9yaWVudGF0aW9uQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0LCB0aGV0YSkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgICB0aGlzLnRoZXRhID0gdGhldGE7XG4gIH07XG5cbiAgUmVsYXguZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIHYxMiA9IG1pbnVzKHRoaXMucDIsIHRoaXMucDEpO1xuICAgIHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueCk7XG4gICAgdmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpO1xuXG4gICAgdmFyIHYzNCA9IG1pbnVzKHRoaXMucDQsIHRoaXMucDMpO1xuICAgIHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueCk7XG4gICAgdmFyIG0zNCA9IG1pZHBvaW50KHRoaXMucDMsIHRoaXMucDQpO1xuXG4gICAgdmFyIGN1cnJUaGV0YSA9IGExMiAtIGEzNDtcbiAgICB2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YTtcbiAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IHdoeSBzZXR0aW5nIGRUaGV0YSB0byAxLzIgdGltZXMgdGhpcyB2YWx1ZSAoYXMgc2hvd24gaW4gdGhlIHBhcGVyXG4gICAgLy8gYW5kIHNlZW1zIHRvIG1ha2Ugc2Vuc2UpIHJlc3VsdHMgaW4ganVtcHkvdW5zdGFibGUgYmVoYXZpb3IuXG5cbiAgICByZXR1cm4ge3AxOiBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMSksXG5cdCAgICBwMjogbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMiksIHRoaXMucDIpLFxuXHQgICAgcDM6IG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wMywgLWRUaGV0YSwgbTM0KSwgdGhpcy5wMyksXG5cdCAgICBwNDogbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnA0LCAtZFRoZXRhLCBtMzQpLCB0aGlzLnA0KX07XG4gIH07XG5cbiAgLy8gTW90b3IgY29uc3RyYWludCAtIGNhdXNlcyBQMSBhbmQgUDIgdG8gb3JiaXQgdGhlaXIgbWlkcG9pbnQgYXQgdGhlIGdpdmVuIHJhdGUuXG4gIC8vIHcgaXMgaW4gdW5pdHMgb2YgSHogLSB3aG9sZSByb3RhdGlvbnMgcGVyIHNlY29uZC5cblxuICBSZWxheC5nZW9tLk1vdG9yQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgdykge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy53ID0gdztcbiAgICB0aGlzLmxhc3RUID0gRGF0ZS5ub3coKTtcbiAgfTtcblxuICBSZWxheC5nZW9tLk1vdG9yQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgdCA9ICh0aW1lTWlsbGlzIC0gdGhpcy5sYXN0VCkgLyAxMDAwLjA7IC8vIHQgaXMgdGltZSBkZWx0YSBpbiAqc2Vjb25kcypcbiAgICB0aGlzLmxhc3RUID0gdGltZU1pbGxpcztcbiAgICB2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqICgyICogTWF0aC5QSSk7XG4gICAgdmFyIG0xMiA9IG1pZHBvaW50KHRoaXMucDEsIHRoaXMucDIpO1xuICAgIHJldHVybiB7cDE6IG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wMSwgZFRoZXRhLCBtMTIpLCB0aGlzLnAxKSxcblx0ICAgIHAyOiBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDIsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMil9O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cztcblxuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEltcG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9hcml0aG1ldGljLWNvbnN0cmFpbnRzLmpzJyk7XG52YXIgaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9nZW9tZXRyaWMtY29uc3RyYWludHMuanMnKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFB1YmxpY1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gUmVsYXgoKSB7XG4gIHRoaXMucmhvID0gMC4yNTtcbiAgdGhpcy5lcHNpbG9uID0gMC4wMTtcbiAgdGhpcy50aGluZ3MgPSBbXTtcbn1cblxuUmVsYXguaXNDb25zdHJhaW50ID0gZnVuY3Rpb24odGhpbmcpIHtcbiAgcmV0dXJuIHRoaW5nLmNvbXB1dGVEZWx0YXMgIT09IHVuZGVmaW5lZDtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih0aGluZykge1xuICB0aGlzLnRoaW5ncy5wdXNoKHRoaW5nKTtcbiAgcmV0dXJuIHRoaW5nO1xufTtcblxuUmVsYXgucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHVud2FudGVkVGhpbmcpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnRoaW5ncyA9IHRoaXMudGhpbmdzLmZpbHRlcihmdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0aGluZyAhPT0gdW53YW50ZWRUaGluZyAmJlxuICAgICAgICAgICAhKFJlbGF4LmlzQ29uc3RyYWludCh0aGluZykgJiYgaW52b2x2ZXModGhpbmcsIHVud2FudGVkVGhpbmcpKTtcbiAgfSk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50aGluZ3MgPSBbXTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5nZXRDb25zdHJhaW50cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy50aGluZ3MuZmlsdGVyKFJlbGF4LmlzQ29uc3RyYWludCk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gIGlmICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pIHtcbiAgICAodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKSgpO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgYWxsRGVsdGFzID0gW107XG5cbiAgLy8gQ29tcHV0ZSBkZWx0YXNcbiAgdGhpcy50aGluZ3MuZm9yRWFjaChmdW5jdGlvbih0KSB7XG4gICAgaWYgKFJlbGF4LmlzQ29uc3RyYWludCh0KSkge1xuICAgICAgdmFyIGMgPSB0O1xuICAgICAgdmFyIGRlbHRhcyA9IGMuY29tcHV0ZURlbHRhcyh0aW1lTWlsbGlzKTtcbiAgICAgIGlmIChoYXNTaWduaWZpY2FudERlbHRhcyhzZWxmLCBkZWx0YXMpKSB7XG5cdGFsbERlbHRhcy5wdXNoKHtjb25zdHJhaW50OiBjLCBkZWx0YXM6IGRlbHRhc30pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gQXBwbHkgZGVsdGFzXG4gIC8vIChUaGlzIHNob3VsZG4ndCBiZSBkb25lIGluIHRoZSBsb29wIGFib3ZlIGIvYyB0aGF0IHdvdWxkIGFmZmVjdCB0aGUgb3RoZXIgZGVsdGEgY29tcHV0YXRpb25zLilcbiAgYWxsRGVsdGFzLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgIGFwcGx5RGVsdGFzKHNlbGYsIGQpO1xuICB9KTtcblxuICByZXR1cm4gYWxsRGVsdGFzLmxlbmd0aCA+IDA7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuaXRlcmF0ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIHZhciBkaWRTb21ldGhpbmc7XG4gIHZhciBub3csIHQwLCB0O1xuICBub3cgPSB0MCA9IERhdGUubm93KCk7XG4gIGRvIHtcbiAgICBkaWRTb21ldGhpbmcgPSB0aGlzLmRvT25lSXRlcmF0aW9uKHQwKTtcbiAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgIHQgPSBub3cgLSB0MDtcbiAgICBjb3VudCArPSBkaWRTb21ldGhpbmcgPyAxIDogMDtcbiAgfSB3aGlsZSAoZGlkU29tZXRoaW5nICYmIHQgPCB0TWlsbGlzKTtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIGhhc1NpZ25pZmljYW50RGVsdGFzKHJlbGF4LCBkZWx0YXMpIHtcbiAgZm9yICh2YXIgcCBpbiBkZWx0YXMpIHtcbiAgICB2YXIgZCA9IGRlbHRhc1twXTtcbiAgICBmb3IgKHZhciBwcm9wIGluIGQpIHtcbiAgICAgIGlmIChkLmhhc093blByb3BlcnR5KHByb3ApICYmIE1hdGguYWJzKGRbcHJvcF0pID4gcmVsYXguZXBzaWxvbikge1xuXHRyZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuZnVuY3Rpb24gYXBwbHlEZWx0YXMocmVsYXgsIHBhdGNoKSB7XG4gIGZvciAodmFyIHAgaW4gcGF0Y2guZGVsdGFzKSB7XG4gICAgdmFyIGQgPSBwYXRjaC5kZWx0YXNbcF07XG4gICAgZm9yICh2YXIgcHJvcCBpbiBkKSB7XG4gICAgICBpZiAoZC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRwYXRjaC5jb25zdHJhaW50W3BdW3Byb3BdICs9IGRbcHJvcF0gKiByZWxheC5yaG87XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBpbnZvbHZlcyhjb25zdHJhaW50LCBvYmopIHtcbiAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG4gICAgaWYgKGNvbnN0cmFpbnRbcF0gPT09IG9iaikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJbnN0YWxsIGNvbnN0cmFpbnQgbGlicmFyaWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFJlbGF4KTtcbmluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhSZWxheCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbGF4O1xuXG4iXX0=
(3)
});
