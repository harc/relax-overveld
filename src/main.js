// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var Delta = require('./Delta.js');
var installArithmeticConstraints = require('./arithmetic-constraints.js').install;
var installGeometricConstraints = require('./geometric-constraints.js').install;

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

