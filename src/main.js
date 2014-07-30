// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var installArithmeticConstraints = require('./arithmetic-constraints.js').install;
var installGeometricConstraints = require('./geometric-constraints.js').install;

// --------------------------------------------------------------------
// Public
// --------------------------------------------------------------------

function Relax() {
  this.rho = 0.25;
  this.epsilon = 0.01;
  this.things = [];
  this.groupedConstraints = null; // computed lazily
}

Relax.prototype.add = function(thing) {
  this.things.push(thing);
  this.groupedConstraints = null; // conservative
  return thing;
};

Relax.prototype.remove = function(unwantedThing) {
  var self = this;
  this.things = this.things.filter(function(thing) {
    return thing !== unwantedThing &&
           !(isConstraint(thing) && involves(thing, unwantedThing));
  });
  this.groupedConstraints = null; // conservative
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

function groupConstraints(things) {
  var sorted = [];
  things.forEach(function (t) {
    if (isConstraint(t)) {
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

function isConstraint(thing) {
  return thing.computeDeltas !== undefined;
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

