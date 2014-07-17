// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var Point = require('./Point.js');
var Constraint = require('./Constraint.js');
var installBuiltInConstraints = require('./installBuiltInConstraints.js');

// --------------------------------------------------------------------
// Meat
// --------------------------------------------------------------------

function Relax() {
  this.rho = 0.25;
  this.epsilon = 0.01;
  this.points = [];
  this.constraints = [];
}

// --------------------------------------------------------------------

var constraintTypes = {};

Relax.declareConstraintType = function(name, ctor, addDeltasFn) {
  constraintTypes[name] = ctor;
  ctor.prototype = new Constraint();
  ctor.prototype.addDeltas = addDeltasFn;
}

Relax.getConstraintType = function(name) {
  if (constraintTypes[name]) {
    return constraintTypes[name];
  } else {
    throw 'unknown constraint type ' + name;
  }
};

installBuiltInConstraints(Relax);

// --------------------------------------------------------------------

Relax.prototype.addPoint = function(x, y) {
  var p = new Point(x, y);
  this.points.push(p);
  return p;
};

Relax.prototype.removePoint = function(unwanted) {
  this.points = this.points.filter(function(p) { return p !== unwanted; });
  this.constraints = this.constraints.filter(function(c) { return !c.involvesPoint(unwanted); });
};

Relax.prototype.addConstraint = function(type /* arg1, arg2, ... */) {
  var ctor = Relax.getConstraintType(type);
  var args = Array.prototype.slice.call(arguments);
  if (args.length - 1 !== ctor.length) {
    throw ['wrong number of arguments to ', type, ' constructor ',
           '(expected ', ctor.length, ' but got ', args.length - 1, ')'].join('');
  }
  var noArgCtor = ctor.bind.apply(ctor, args);
  var c = new noArgCtor();
  this.constraints.push(c);
  return c;
};

Relax.prototype.removeConstraint = function(unwanted) {
  this.constraints = this.constraints.filter(function(c) { return c !== unwanted; });
};

Relax.prototype.doOneIteration = function(t) {
  if (this.beforeEachIteration) {
    (this.beforeEachIteration)();
  }

  var self = this;
  this.points.forEach(function(p) { p.clearDelta(); });
  this.constraints.forEach(function(c) { c.addDeltas(t); });
  var didSomething = false;
  this.points.forEach(function(p) {
    didSomething |= p.delta.x > self.epsilon || p.delta.y > self.epsilon;
  });
  if (didSomething) {
    this.points.forEach(function(p) {
      p.x += self.rho * p.delta.x;
      p.y += self.rho * p.delta.y;
    });
    return true;
  } else {
    return false;
  }
};

Relax.prototype.iterateForUpToMillis = function(tMillis) {
  var count = 0;
  var now, t0, t;
  var didSomething = true;
  now = t0 = Date.now();
  t = 0;
  while (t < tMillis && didSomething) {
    didSomething = this.doOneIteration(now);
    now = Date.now();
    t = now - t0;
    if (didSomething) {
      count++;
    }
  }
  return count;
};

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Relax;

