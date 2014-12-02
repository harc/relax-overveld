!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Relax=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
  this.groupedConstraints = null; // computed lazily
}

Relax.isConstraint = function(thing) {
  return thing.computeDeltas !== undefined;
};

Relax.prototype.add = function(thing) {
  this.things.push(thing);
  this.groupedConstraints = null; // conservative
  return thing;
};

Relax.prototype.remove = function(unwantedThing) {
  var self = this;
  this.things = this.things.filter(function(thing) {
    return thing !== unwantedThing &&
           !(Relax.isConstraint(thing) && involves(thing, unwantedThing));
  });
  this.groupedConstraints = null; // conservative
};

Relax.prototype.clear = function() {
  this.things = [];
  this.groupedConstraints = null;
};

Relax.prototype.getConstraints = function() {
  return this.things.filter(Relax.isConstraint);
};

Relax.prototype.doOneIteration = function(timeMillis) {
  if (this.beforeEachIteration) {
    (this.beforeEachIteration)();
  }
  var self = this;
  var didSomething = false;

  if (this.groupedConstraints === null) {
    this.groupedConstraints = groupConstraints(this.things);
  }

  // Constraints have been grouped and ordered by their priority.
  // this.groupedConstraints is a list of lists of constraints. Each
  // list in the outer list is a group of equal-priority constraints.
  // The groups are sorted ascending by constraint priority.
  //
  // We loop over groups, lowest priority first, running one round of
  // constraint-relaxation for each constraint in a group and then
  // applying the changes from that group. That way, lowest priority
  // constraints affect their variables first, and highest-priority
  // constraints get to have the last word.

  this.groupedConstraints.forEach(function (things) {
    var allDeltas = [];
    var localDidSomething = false;
    things.forEach(function(c) {
      var deltas = c.computeDeltas(timeMillis);
      if (hasSignificantDeltas(self, deltas)) {
	localDidSomething = true;
	allDeltas.push({constraint: c, deltas: deltas});
      }
    });
    if (localDidSomething) {
      allDeltas.forEach(function(d) {
	applyDeltas(self, d);
      });
      didSomething = true;
    }
  });

  return didSomething;
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

function groupConstraints(things) {
  var sorted = [];
  things.forEach(function (t) {
    if (Relax.isConstraint(t)) {
      sorted.push([t.priority || 0, t]);
    }
  });
  sorted.sort();
  var grouped = [];
  var group = null;
  var currentPriority = null;
  sorted.forEach(function (e) {
    var priority = e[0];
    var thing = e[1];
    if (currentPriority !== priority) {
      if (group) {
	grouped.push(group);
      }
      group = [];
      currentPriority = priority;
    }
    group.push(thing);
  });
  if (group && group.length) {
    grouped.push(group);
  }
  return grouped;
};

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC1vdmVydmVsZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4LW92ZXJ2ZWxkL3NyYy9hcml0aG1ldGljLWNvbnN0cmFpbnRzLmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4LW92ZXJ2ZWxkL3NyYy9nZW9tZXRyaWMtY29uc3RyYWludHMuanMiLCIvVXNlcnMvYXdhcnRoL3Byb2cvcmVsYXgtb3ZlcnZlbGQvc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBpbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFJlbGF4KSB7XG5cbiAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2YgYXJpdGhtZXRpYyBjb25zdHJhaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvXG4gIC8vIGFyYml0cmFyeSBwcm9wZXJ0aWVzIG9mIGFyYml0cmFyeSBvYmplY3RzLiBcIlJlZmVyZW5jZXNcIiBhcmUgcmVwcmVzZW50ZWRcbiAgLy8gYXMgKG9iamVjdCwgcHJvcGVydHlOYW1lKSB0dXBsZXMsIGUuZy4sIHtvYmo6IHlvdXJNb20sIHByb3A6ICd3ZWlnaHQnfS5cblxuICBSZWxheC5hcml0aCA9IHt9O1xuXG4gIC8vIEhlbHBlcnNcblxuICBmdW5jdGlvbiBpbnN0YWxsUmVmKHRhcmdldCwgcmVmLCBwcmVmaXgpIHtcbiAgICB0YXJnZXRbcHJlZml4ICsgJ19vYmonXSA9IHJlZi5vYmo7XG4gICAgdGFyZ2V0W3ByZWZpeCArICdfcHJvcCddID0gcmVmLnByb3A7XG4gIH1cblxuICBmdW5jdGlvbiByZWYodGFyZ2V0LCBwcmVmaXgpIHtcbiAgICByZXR1cm4gdGFyZ2V0W3ByZWZpeCArICdfb2JqJ11bdGFyZ2V0W3ByZWZpeCArICdfcHJvcCddXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbHRhcyh0YXJnZXQgLyogLCBwcmVmaXgsIGRlbHRhLCAuLi4gKi8pIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHZhciBwcmVmaXggPSBhcmd1bWVudHNbaV07XG4gICAgICB2YXIgZGVsdGEgPSBhcmd1bWVudHNbaSsxXTtcbiAgICAgIGlmICghaXNGaW5pdGUoZGVsdGEpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIGQgPSByZXN1bHRbcHJlZml4ICsgJ19vYmonXTtcbiAgICAgIGlmICghZCkge1xuXHRyZXN1bHRbcHJlZml4ICsgJ19vYmonXSA9IGQgPSB7fTtcbiAgICAgIH1cbiAgICAgIGRbdGFyZ2V0W3ByZWZpeCArICdfcHJvcCddXSA9IGRlbHRhO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gVmFsdWUgQ29uc3RyYWludCwgaS5lLiwgby5wID0gdmFsdWVcblxuICBSZWxheC5hcml0aC5WYWx1ZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihyZWYsIHZhbHVlKSB7XG4gICAgaW5zdGFsbFJlZih0aGlzLCByZWYsICd2Jyk7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgUmVsYXguYXJpdGguVmFsdWVDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHJldHVybiBkZWx0YXModGhpcywgJ3YnLCB0aGlzLnZhbHVlIC0gcmVmKHRoaXMsICd2JykpO1xuICB9O1xuXG4gIC8vIEVxdWFsaXR5IENvbnN0cmFpbnQsIGkuZS4sIG8xLnAxID0gbzIucDJcblxuICBSZWxheC5hcml0aC5FcXVhbGl0eUNvbnN0cmFpbnQgPSBmdW5jdGlvbihyZWYxLCByZWYyKSB7XG4gICAgaW5zdGFsbFJlZih0aGlzLCByZWYxLCAndjEnKTtcbiAgICBpbnN0YWxsUmVmKHRoaXMsIHJlZjIsICd2MicpO1xuICB9XG5cbiAgUmVsYXguYXJpdGguRXF1YWxpdHlDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBkaWZmID0gcmVmKHRoaXMsICd2MScpIC0gcmVmKHRoaXMsICd2MicpO1xuICAgIHJldHVybiBkZWx0YXModGhpcyxcbiAgICAgICAgJ3YxJywgLWRpZmYgLyAyLFxuICAgICAgICAndjInLCArZGlmZiAvIDIpO1xuICB9O1xuXG4gIC8vIFN1bSBDb25zdHJhaW50LCBpLmUuLCBvMS5wMSArIG8yLnAyID0gbzMucDNcblxuICBSZWxheC5hcml0aC5TdW1Db25zdHJhaW50ID0gZnVuY3Rpb24ocmVmMSwgcmVmMiwgcmVmMykge1xuICAgIGluc3RhbGxSZWYodGhpcywgcmVmMSwgJ3YxJyk7XG4gICAgaW5zdGFsbFJlZih0aGlzLCByZWYyLCAndjInKTtcbiAgICBpbnN0YWxsUmVmKHRoaXMsIHJlZjMsICd2MycpO1xuICB9XG5cbiAgUmVsYXguYXJpdGguU3VtQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgZGlmZiA9IHJlZih0aGlzLCAndjMnKSAtIChyZWYodGhpcywgJ3YxJykgKyByZWYodGhpcywgJ3YyJykpO1xuICAgIHJldHVybiBkZWx0YXModGhpcyxcbiAgICAgICAgJ3YxJywgK2RpZmYgLyAzLFxuICAgICAgICAndjInLCArZGlmZiAvIDMsXG4gICAgICAgICd2MycsIC1kaWZmIC8gMyk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cztcblxuIiwiZnVuY3Rpb24gaW5zdGFsbEdlb21ldHJpY0NvbnN0cmFpbnRzKFJlbGF4KSB7XG5cbiAgLy8gVGhpcyBpcyBhIGNvbGxlY3Rpb24gb2YgZ2VvbWV0cmljIGNvbnN0cmFpbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG9cbiAgLy8gb2JqZWN0cyB0aGF0IGhhdmUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBPdGhlciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuXG4gIFJlbGF4Lmdlb20gPSB7fTtcblxuICAvLyBIZWxwZXJzXG5cbiAgZnVuY3Rpb24gc3F1YXJlKG4pIHtcbiAgICByZXR1cm4gbiAqIG47XG4gIH1cblxuICBmdW5jdGlvbiBwbHVzKHAxLCBwMikge1xuICAgIHJldHVybiB7eDogcDEueCArIHAyLngsIHk6IHAxLnkgKyBwMi55fTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1pbnVzKHAxLCBwMikge1xuICAgIHJldHVybiB7eDogcDEueCAtIHAyLngsIHk6IHAxLnkgLSBwMi55fTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYWxlZEJ5KHAsIG0pIHtcbiAgICByZXR1cm4ge3g6IHAueCAqIG0sIHk6IHAueSAqIG19O1xuICB9XG5cbiAgZnVuY3Rpb24gY29weShwKSB7XG4gICAgcmV0dXJuIHNjYWxlZEJ5KHAsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWlkcG9pbnQocDEsIHAyKSB7XG4gICAgcmV0dXJuIHNjYWxlZEJ5KHBsdXMocDEsIHAyKSwgMC41KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1hZ25pdHVkZShwKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydChzcXVhcmUocC54KSArIHNxdWFyZShwLnkpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZWQocCkge1xuICAgIHJldHVybiBzY2FsZWRCeShwLCAxIC8gbWFnbml0dWRlKHApKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJvdGF0ZWRCeShwLCBkVGhldGEpIHtcbiAgICB2YXIgYyA9IE1hdGguY29zKGRUaGV0YSk7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihkVGhldGEpO1xuICAgIHJldHVybiB7eDogYypwLnggLSBzKnAueSwgeTogcypwLnggKyBjKnAueX07XG4gIH1cblxuICBmdW5jdGlvbiByb3RhdGVkQXJvdW5kKHAsIGRUaGV0YSwgYXhpcykge1xuICAgIHJldHVybiBwbHVzKGF4aXMsIHJvdGF0ZWRCeShtaW51cyhwLCBheGlzKSwgZFRoZXRhKSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREZWx0YShkLCBwLCBzY2FsZSkge1xuICAgIGQueCA9IHAueCAqIHNjYWxlO1xuICAgIGQueSA9IHAueSAqIHNjYWxlO1xuICB9XG5cbiAgUmVsYXguZ2VvbS5zcXVhcmUgPSBzcXVhcmU7XG4gIFJlbGF4Lmdlb20ucGx1cyA9IHBsdXM7XG4gIFJlbGF4Lmdlb20ubWludXMgPSBtaW51cztcbiAgUmVsYXguZ2VvbS5zY2FsZWRCeSA9IHNjYWxlZEJ5O1xuICBSZWxheC5nZW9tLmNvcHkgPSBjb3B5O1xuICBSZWxheC5nZW9tLm1pZHBvaW50ID0gbWlkcG9pbnQ7XG4gIFJlbGF4Lmdlb20ubWFnbml0dWRlID0gbWFnbml0dWRlO1xuICBSZWxheC5nZW9tLm5vcm1hbGl6ZWQgPSBub3JtYWxpemVkO1xuICBSZWxheC5nZW9tLnJvdGF0ZWRCeSA9IHJvdGF0ZWRCeTtcbiAgUmVsYXguZ2VvbS5yb3RhdGVkQXJvdW5kID0gcm90YXRlZEFyb3VuZDtcbiAgUmVsYXguZ2VvbS5zZXREZWx0YSA9IHNldERlbHRhO1xuXG4gIC8vIENvb3JkaW5hdGUgQ29uc3RyYWludCwgaS5lLiwgXCJJIHdhbnQgdGhpcyBwb2ludCB0byBiZSBoZXJlXCIuXG5cbiAgUmVsYXguZ2VvbS5Db29yZGluYXRlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAsIHgsIHkpIHtcbiAgICB0aGlzLnAgPSBwO1xuICAgIHRoaXMuYyA9IHt4OiB4LCB5OiB5fTtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uQ29vcmRpbmF0ZUNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgcmV0dXJuIHtwOiBtaW51cyh0aGlzLmMsIHRoaXMucCl9O1xuICB9O1xuXG4gIC8vIENvaW5jaWRlbmNlIENvbnN0cmFpbnQsIGkuZS4sIEkgd2FudCB0aGVzZSB0d28gcG9pbnRzIHRvIGJlIGF0IHRoZSBzYW1lIHBsYWNlLlxuXG4gIFJlbGF4Lmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24ocDEsIHAyKSB7XG4gICAgdGhpcy5wMSA9IHAxO1xuICAgIHRoaXMucDIgPSBwMjtcbiAgfVxuXG4gIFJlbGF4Lmdlb20uQ29pbmNpZGVuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBzcGxpdERpZmYgPSBzY2FsZWRCeShtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSwgMC41KTtcbiAgICByZXR1cm4ge3AxOiBzcGxpdERpZmYsIHAyOiBzY2FsZWRCeShzcGxpdERpZmYsIC0xKX07XG4gIH07XG5cbiAgLy8gRXF1aXZhbGVuY2UgQ29uc3RyYWludCwgaS5lLiwgSSB3YW50IHRoZSB2ZWN0b3JzIHAxLT5wMiBhbmQgcDMtPnA0IHRvIGJlIHRoZSBzYW1lLlxuXG4gIFJlbGF4Lmdlb20uRXF1aXZhbGVuY2VDb25zdHJhaW50ID0gZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMucDMgPSBwMztcbiAgICB0aGlzLnA0ID0gcDQ7XG4gIH1cblxuICBSZWxheC5nZW9tLkVxdWl2YWxlbmNlQ29uc3RyYWludC5wcm90b3R5cGUuY29tcHV0ZURlbHRhcyA9IGZ1bmN0aW9uKHRpbWVNaWxsaXMpIHtcbiAgICB2YXIgc3BsaXREaWZmID0gc2NhbGVkQnkobWludXMocGx1cyh0aGlzLnAyLCB0aGlzLnAzKSwgcGx1cyh0aGlzLnAxLCB0aGlzLnA0KSksIDAuMjUpO1xuICAgIHJldHVybiB7cDE6IHNwbGl0RGlmZixcblx0ICAgIHAyOiBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSxcblx0ICAgIHAzOiBzY2FsZWRCeShzcGxpdERpZmYsIC0xKSxcblx0ICAgIHA0OiBzcGxpdERpZmZ9O1xuICB9O1xuXG4gIC8vIEVxdWFsIERpc3RhbmNlIGNvbnN0cmFpbnQgLSBrZWVwcyBkaXN0YW5jZXMgUDEtLT5QMiwgUDMtLT5QNCBlcXVhbFxuXG4gIFJlbGF4Lmdlb20uRXF1YWxEaXN0YW5jZUNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5wMyA9IHAzO1xuICAgIHRoaXMucDQgPSBwNDtcbiAgfTtcblxuICBSZWxheC5nZW9tLkVxdWFsRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciBsMTIgPSBtYWduaXR1ZGUobWludXModGhpcy5wMSwgdGhpcy5wMikpO1xuICAgIHZhciBsMzQgPSBtYWduaXR1ZGUobWludXModGhpcy5wMywgdGhpcy5wNCkpO1xuICAgIHZhciBkZWx0YSA9IChsMTIgLSBsMzQpIC8gNDtcbiAgICB2YXIgZTEyID0gc2NhbGVkQnkobm9ybWFsaXplZChtaW51cyh0aGlzLnAyLCB0aGlzLnAxKSksIGRlbHRhKTtcbiAgICB2YXIgZTM0ID0gc2NhbGVkQnkobm9ybWFsaXplZChtaW51cyh0aGlzLnA0LCB0aGlzLnAzKSksIGRlbHRhKTtcbiAgICByZXR1cm4ge3AxOiBlMTIsXG5cdCAgICBwMjogc2NhbGVkQnkoZTEyLCAtMSksXG5cdCAgICBwMzogc2NhbGVkQnkoZTM0LCAtMSksXG5cdCAgICBwNDogZTM0fTtcbiAgfTtcblxuICAvLyBMZW5ndGggY29uc3RyYWludCAtIG1haW50YWlucyBkaXN0YW5jZSBiZXR3ZWVuIFAxIGFuZCBQMiBhdCBMLlxuXG4gIFJlbGF4Lmdlb20uTGVuZ3RoQ29uc3RyYWludCA9IGZ1bmN0aW9uKHAxLCBwMiwgbCkge1xuICAgIHRoaXMucDEgPSBwMTtcbiAgICB0aGlzLnAyID0gcDI7XG4gICAgdGhpcy5sID0gbDtcbiAgfTtcblxuICBSZWxheC5nZW9tLkxlbmd0aENvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIGwxMiA9IG1hZ25pdHVkZShtaW51cyh0aGlzLnAxLCB0aGlzLnAyKSk7XG4gICAgdmFyIGRlbHRhID0gKGwxMiAtIHRoaXMubCkgLyAyO1xuICAgIHZhciBlMTIgPSBzY2FsZWRCeShub3JtYWxpemVkKG1pbnVzKHRoaXMucDIsIHRoaXMucDEpKSwgZGVsdGEpO1xuICAgIHJldHVybiB7cDE6IGUxMixcblx0ICAgIHAyOiBzY2FsZWRCeShlMTIsIC0xKX07XG4gIH07XG5cbiAgLy8gT3JpZW50YXRpb24gY29uc3RyYWludCAtIG1haW50YWlucyBhbmdsZSBiZXR3ZWVuIFAxLT5QMiBhbmQgUDMtPlA0IGF0IFRoZXRhXG5cbiAgUmVsYXguZ2VvbS5PcmllbnRhdGlvbkNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCwgdGhldGEpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMucDMgPSBwMztcbiAgICB0aGlzLnA0ID0gcDQ7XG4gICAgdGhpcy50aGV0YSA9IHRoZXRhO1xuICB9O1xuXG4gIFJlbGF4Lmdlb20uT3JpZW50YXRpb25Db25zdHJhaW50LnByb3RvdHlwZS5jb21wdXRlRGVsdGFzID0gZnVuY3Rpb24odGltZU1pbGxpcykge1xuICAgIHZhciB2MTIgPSBtaW51cyh0aGlzLnAyLCB0aGlzLnAxKTtcbiAgICB2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpO1xuICAgIHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKTtcblxuICAgIHZhciB2MzQgPSBtaW51cyh0aGlzLnA0LCB0aGlzLnAzKTtcbiAgICB2YXIgYTM0ID0gTWF0aC5hdGFuMih2MzQueSwgdjM0LngpO1xuICAgIHZhciBtMzQgPSBtaWRwb2ludCh0aGlzLnAzLCB0aGlzLnA0KTtcblxuICAgIHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzQ7XG4gICAgdmFyIGRUaGV0YSA9IHRoaXMudGhldGEgLSBjdXJyVGhldGE7XG4gICAgLy8gVE9ETzogZmlndXJlIG91dCB3aHkgc2V0dGluZyBkVGhldGEgdG8gMS8yIHRpbWVzIHRoaXMgdmFsdWUgKGFzIHNob3duIGluIHRoZSBwYXBlclxuICAgIC8vIGFuZCBzZWVtcyB0byBtYWtlIHNlbnNlKSByZXN1bHRzIGluIGp1bXB5L3Vuc3RhYmxlIGJlaGF2aW9yLlxuXG4gICAgcmV0dXJuIHtwMTogbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnAxLCBkVGhldGEsIG0xMiksIHRoaXMucDEpLFxuXHQgICAgcDI6IG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wMiwgZFRoZXRhLCBtMTIpLCB0aGlzLnAyKSxcblx0ICAgIHAzOiBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDMsIC1kVGhldGEsIG0zNCksIHRoaXMucDMpLFxuXHQgICAgcDQ6IG1pbnVzKHJvdGF0ZWRBcm91bmQodGhpcy5wNCwgLWRUaGV0YSwgbTM0KSwgdGhpcy5wNCl9O1xuICB9O1xuXG4gIC8vIE1vdG9yIGNvbnN0cmFpbnQgLSBjYXVzZXMgUDEgYW5kIFAyIHRvIG9yYml0IHRoZWlyIG1pZHBvaW50IGF0IHRoZSBnaXZlbiByYXRlLlxuICAvLyB3IGlzIGluIHVuaXRzIG9mIEh6IC0gd2hvbGUgcm90YXRpb25zIHBlciBzZWNvbmQuXG5cbiAgUmVsYXguZ2VvbS5Nb3RvckNvbnN0cmFpbnQgPSBmdW5jdGlvbihwMSwgcDIsIHcpIHtcbiAgICB0aGlzLnAxID0gcDE7XG4gICAgdGhpcy5wMiA9IHAyO1xuICAgIHRoaXMudyA9IHc7XG4gICAgdGhpcy5sYXN0VCA9IERhdGUubm93KCk7XG4gIH07XG5cbiAgUmVsYXguZ2VvbS5Nb3RvckNvbnN0cmFpbnQucHJvdG90eXBlLmNvbXB1dGVEZWx0YXMgPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gICAgdmFyIHQgPSAodGltZU1pbGxpcyAtIHRoaXMubGFzdFQpIC8gMTAwMC4wOyAvLyB0IGlzIHRpbWUgZGVsdGEgaW4gKnNlY29uZHMqXG4gICAgdGhpcy5sYXN0VCA9IHRpbWVNaWxsaXM7XG4gICAgdmFyIGRUaGV0YSA9IHQgKiB0aGlzLncgKiAoMiAqIE1hdGguUEkpO1xuICAgIHZhciBtMTIgPSBtaWRwb2ludCh0aGlzLnAxLCB0aGlzLnAyKTtcbiAgICByZXR1cm4ge3AxOiBtaW51cyhyb3RhdGVkQXJvdW5kKHRoaXMucDEsIGRUaGV0YSwgbTEyKSwgdGhpcy5wMSksXG5cdCAgICBwMjogbWludXMocm90YXRlZEFyb3VuZCh0aGlzLnAyLCBkVGhldGEsIG0xMiksIHRoaXMucDIpfTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsR2VvbWV0cmljQ29uc3RyYWludHM7XG5cbiIsIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJbXBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgaW5zdGFsbEFyaXRobWV0aWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vYXJpdGhtZXRpYy1jb25zdHJhaW50cy5qcycpO1xudmFyIGluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyA9IHJlcXVpcmUoJy4vZ2VvbWV0cmljLWNvbnN0cmFpbnRzLmpzJyk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQdWJsaWNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIFJlbGF4KCkge1xuICB0aGlzLnJobyA9IDAuMjU7XG4gIHRoaXMuZXBzaWxvbiA9IDAuMDE7XG4gIHRoaXMudGhpbmdzID0gW107XG4gIHRoaXMuZ3JvdXBlZENvbnN0cmFpbnRzID0gbnVsbDsgLy8gY29tcHV0ZWQgbGF6aWx5XG59XG5cblJlbGF4LmlzQ29uc3RyYWludCA9IGZ1bmN0aW9uKHRoaW5nKSB7XG4gIHJldHVybiB0aGluZy5jb21wdXRlRGVsdGFzICE9PSB1bmRlZmluZWQ7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odGhpbmcpIHtcbiAgdGhpcy50aGluZ3MucHVzaCh0aGluZyk7XG4gIHRoaXMuZ3JvdXBlZENvbnN0cmFpbnRzID0gbnVsbDsgLy8gY29uc2VydmF0aXZlXG4gIHJldHVybiB0aGluZztcbn07XG5cblJlbGF4LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih1bndhbnRlZFRoaW5nKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy50aGluZ3MgPSB0aGlzLnRoaW5ncy5maWx0ZXIoZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdGhpbmcgIT09IHVud2FudGVkVGhpbmcgJiZcbiAgICAgICAgICAgIShSZWxheC5pc0NvbnN0cmFpbnQodGhpbmcpICYmIGludm9sdmVzKHRoaW5nLCB1bndhbnRlZFRoaW5nKSk7XG4gIH0pO1xuICB0aGlzLmdyb3VwZWRDb25zdHJhaW50cyA9IG51bGw7IC8vIGNvbnNlcnZhdGl2ZVxufTtcblxuUmVsYXgucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudGhpbmdzID0gW107XG4gIHRoaXMuZ3JvdXBlZENvbnN0cmFpbnRzID0gbnVsbDtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5nZXRDb25zdHJhaW50cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy50aGluZ3MuZmlsdGVyKFJlbGF4LmlzQ29uc3RyYWludCk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0aW1lTWlsbGlzKSB7XG4gIGlmICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pIHtcbiAgICAodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKSgpO1xuICB9XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRpZFNvbWV0aGluZyA9IGZhbHNlO1xuXG4gIGlmICh0aGlzLmdyb3VwZWRDb25zdHJhaW50cyA9PT0gbnVsbCkge1xuICAgIHRoaXMuZ3JvdXBlZENvbnN0cmFpbnRzID0gZ3JvdXBDb25zdHJhaW50cyh0aGlzLnRoaW5ncyk7XG4gIH1cblxuICAvLyBDb25zdHJhaW50cyBoYXZlIGJlZW4gZ3JvdXBlZCBhbmQgb3JkZXJlZCBieSB0aGVpciBwcmlvcml0eS5cbiAgLy8gdGhpcy5ncm91cGVkQ29uc3RyYWludHMgaXMgYSBsaXN0IG9mIGxpc3RzIG9mIGNvbnN0cmFpbnRzLiBFYWNoXG4gIC8vIGxpc3QgaW4gdGhlIG91dGVyIGxpc3QgaXMgYSBncm91cCBvZiBlcXVhbC1wcmlvcml0eSBjb25zdHJhaW50cy5cbiAgLy8gVGhlIGdyb3VwcyBhcmUgc29ydGVkIGFzY2VuZGluZyBieSBjb25zdHJhaW50IHByaW9yaXR5LlxuICAvL1xuICAvLyBXZSBsb29wIG92ZXIgZ3JvdXBzLCBsb3dlc3QgcHJpb3JpdHkgZmlyc3QsIHJ1bm5pbmcgb25lIHJvdW5kIG9mXG4gIC8vIGNvbnN0cmFpbnQtcmVsYXhhdGlvbiBmb3IgZWFjaCBjb25zdHJhaW50IGluIGEgZ3JvdXAgYW5kIHRoZW5cbiAgLy8gYXBwbHlpbmcgdGhlIGNoYW5nZXMgZnJvbSB0aGF0IGdyb3VwLiBUaGF0IHdheSwgbG93ZXN0IHByaW9yaXR5XG4gIC8vIGNvbnN0cmFpbnRzIGFmZmVjdCB0aGVpciB2YXJpYWJsZXMgZmlyc3QsIGFuZCBoaWdoZXN0LXByaW9yaXR5XG4gIC8vIGNvbnN0cmFpbnRzIGdldCB0byBoYXZlIHRoZSBsYXN0IHdvcmQuXG5cbiAgdGhpcy5ncm91cGVkQ29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAodGhpbmdzKSB7XG4gICAgdmFyIGFsbERlbHRhcyA9IFtdO1xuICAgIHZhciBsb2NhbERpZFNvbWV0aGluZyA9IGZhbHNlO1xuICAgIHRoaW5ncy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHZhciBkZWx0YXMgPSBjLmNvbXB1dGVEZWx0YXModGltZU1pbGxpcyk7XG4gICAgICBpZiAoaGFzU2lnbmlmaWNhbnREZWx0YXMoc2VsZiwgZGVsdGFzKSkge1xuXHRsb2NhbERpZFNvbWV0aGluZyA9IHRydWU7XG5cdGFsbERlbHRhcy5wdXNoKHtjb25zdHJhaW50OiBjLCBkZWx0YXM6IGRlbHRhc30pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChsb2NhbERpZFNvbWV0aGluZykge1xuICAgICAgYWxsRGVsdGFzLmZvckVhY2goZnVuY3Rpb24oZCkge1xuXHRhcHBseURlbHRhcyhzZWxmLCBkKTtcbiAgICAgIH0pO1xuICAgICAgZGlkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkaWRTb21ldGhpbmc7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuaXRlcmF0ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIHZhciBkaWRTb21ldGhpbmc7XG4gIHZhciBub3csIHQwLCB0O1xuICBub3cgPSB0MCA9IERhdGUubm93KCk7XG4gIGRvIHtcbiAgICBkaWRTb21ldGhpbmcgPSB0aGlzLmRvT25lSXRlcmF0aW9uKHQwKTtcbiAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgIHQgPSBub3cgLSB0MDtcbiAgICBjb3VudCArPSBkaWRTb21ldGhpbmcgPyAxIDogMDtcbiAgfSB3aGlsZSAoZGlkU29tZXRoaW5nICYmIHQgPCB0TWlsbGlzKTtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIGdyb3VwQ29uc3RyYWludHModGhpbmdzKSB7XG4gIHZhciBzb3J0ZWQgPSBbXTtcbiAgdGhpbmdzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbiAgICBpZiAoUmVsYXguaXNDb25zdHJhaW50KHQpKSB7XG4gICAgICBzb3J0ZWQucHVzaChbdC5wcmlvcml0eSB8fCAwLCB0XSk7XG4gICAgfVxuICB9KTtcbiAgc29ydGVkLnNvcnQoKTtcbiAgdmFyIGdyb3VwZWQgPSBbXTtcbiAgdmFyIGdyb3VwID0gbnVsbDtcbiAgdmFyIGN1cnJlbnRQcmlvcml0eSA9IG51bGw7XG4gIHNvcnRlZC5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHByaW9yaXR5ID0gZVswXTtcbiAgICB2YXIgdGhpbmcgPSBlWzFdO1xuICAgIGlmIChjdXJyZW50UHJpb3JpdHkgIT09IHByaW9yaXR5KSB7XG4gICAgICBpZiAoZ3JvdXApIHtcblx0Z3JvdXBlZC5wdXNoKGdyb3VwKTtcbiAgICAgIH1cbiAgICAgIGdyb3VwID0gW107XG4gICAgICBjdXJyZW50UHJpb3JpdHkgPSBwcmlvcml0eTtcbiAgICB9XG4gICAgZ3JvdXAucHVzaCh0aGluZyk7XG4gIH0pO1xuICBpZiAoZ3JvdXAgJiYgZ3JvdXAubGVuZ3RoKSB7XG4gICAgZ3JvdXBlZC5wdXNoKGdyb3VwKTtcbiAgfVxuICByZXR1cm4gZ3JvdXBlZDtcbn07XG5cbmZ1bmN0aW9uIGhhc1NpZ25pZmljYW50RGVsdGFzKHJlbGF4LCBkZWx0YXMpIHtcbiAgZm9yICh2YXIgcCBpbiBkZWx0YXMpIHtcbiAgICB2YXIgZCA9IGRlbHRhc1twXTtcbiAgICBmb3IgKHZhciBwcm9wIGluIGQpIHtcbiAgICAgIGlmIChkLmhhc093blByb3BlcnR5KHByb3ApICYmIE1hdGguYWJzKGRbcHJvcF0pID4gcmVsYXguZXBzaWxvbikge1xuXHRyZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuZnVuY3Rpb24gYXBwbHlEZWx0YXMocmVsYXgsIHBhdGNoKSB7XG4gIGZvciAodmFyIHAgaW4gcGF0Y2guZGVsdGFzKSB7XG4gICAgdmFyIGQgPSBwYXRjaC5kZWx0YXNbcF07XG4gICAgZm9yICh2YXIgcHJvcCBpbiBkKSB7XG4gICAgICBpZiAoZC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRwYXRjaC5jb25zdHJhaW50W3BdW3Byb3BdICs9IGRbcHJvcF0gKiByZWxheC5yaG87XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBpbnZvbHZlcyhjb25zdHJhaW50LCBvYmopIHtcbiAgZm9yICh2YXIgcCBpbiBjb25zdHJhaW50KSB7XG4gICAgaWYgKGNvbnN0cmFpbnRbcF0gPT09IG9iaikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJbnN0YWxsIGNvbnN0cmFpbnQgbGlicmFyaWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbnN0YWxsQXJpdGhtZXRpY0NvbnN0cmFpbnRzKFJlbGF4KTtcbmluc3RhbGxHZW9tZXRyaWNDb25zdHJhaW50cyhSZWxheCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbGF4O1xuXG4iXX0=
(3)
});
