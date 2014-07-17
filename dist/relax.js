!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Relax=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
function Constraint() {}

Constraint.prototype.involvesPoint = function(p) {
  var self = this;
  return Object.keys(this)
      .map(function(key) { return self[key] === p; })
      .reduce(function(a, b) { return a || b; });
};

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Constraint;


},{}],2:[function(_dereq_,module,exports){
function square(x) {
  return x * x;
}

function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.plus = function(that) {
  return new Point(this.x + that.x, this.y + that.y);
};

Point.prototype.minus = function(that) {
  return new Point(this.x - that.x, this.y - that.y);
};

Point.prototype.negated = function() {
  return this.scaledBy(-1);
};

Point.prototype.clone = function() {
  return this.scaledBy(1);
};

Point.prototype.clearDelta = function() {
  if (this.delta) {
    this.delta.x = this.delta.y = 0;
  } else {
    this.delta = new Point(0, 0);
  }
};

Point.prototype.addDelta = function(d) {
  this.delta.x += d.x;
  this.delta.y += d.y;
};

// The following methods only make sense when the Point represents a vector.

Point.prototype.scaledBy = function(n) {
  return new Point(this.x * n, this.y * n);
};

Point.prototype.magnitude = function() {
  return Math.sqrt(square(this.x) + square(this.y));
};

Point.prototype.normalized = function() {
  return this.scaledBy(1 / this.magnitude());
};

Point.prototype.rotatedBy = function(dTheta) {
  var theta = Math.atan2(this.y, this.x) + dTheta;
  var mag = this.magnitude();
  return new Point(mag * Math.cos(theta), mag * Math.sin(theta));
};

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Point;


},{}],3:[function(_dereq_,module,exports){
Point = _dereq_('./Point.js');

function installBuiltInConstraints(Relax) {
  Relax.declareConstraintType(
      'coordinate',

      function(p, x, y) {
        this.p = p;
        this.c = new Point(x, y);
      },

      function() {
        this.p.addDelta(this.c.minus(this.p));
      }
  );

  Relax.declareConstraintType(
      'coincidence',

      function(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
      },

      function() {
        var d = this.p2.minus(this.p1).scaledBy(0.5);
        this.p1.addDelta(d);
        this.p2.addDelta(d.negated());
      }
  );

  Relax.declareConstraintType(
      'equivalence',

      function(p1, p2, p3, p4) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
      },

      function() {
        var d1 = this.p2.plus(this.p3).minus(this.p4).minus(this.p1).scaledBy(0.25);
        this.p1.addDelta(d1);
        this.p4.addDelta(d1);

        var d2 = this.p1.plus(this.p4).minus(this.p2).minus(this.p3).scaledBy(0.25);
        this.p2.addDelta(d2);
        this.p3.addDelta(d2);
      }
  );

  Relax.declareConstraintType(
      'eqdist',

      function(p1, p2, p3, p4) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
      },

      function() {
        var l12 = this.p1.minus(this.p2).magnitude();
        var l34 = this.p3.minus(this.p4).magnitude();
        var delta = (l12 - l34) / 4;
        var e12 = this.p2.minus(this.p1).normalized();
        var e34 = this.p4.minus(this.p3).normalized();

        this.p1.addDelta(e12.scaledBy(delta));
        this.p2.addDelta(e12.scaledBy(-delta));
        this.p3.addDelta(e34.scaledBy(-delta));
        this.p4.addDelta(e34.scaledBy(delta));
      }
  );

  Relax.declareConstraintType(
      'length',

      function(p1, p2, l) {
        this.p1 = p1;
        this.p2 = p2;
        this.l = l;
      },

      function() {
        var l12 = this.p1.minus(this.p2).magnitude();
        var delta = (l12 - this.l) / 2;
        var e12 = this.p2.minus(this.p1).normalized();

        var d = e12.scaledBy(delta);
        this.p1.addDelta(d);
        this.p2.addDelta(d.negated());
      }
  );

  Relax.declareConstraintType(
      'orientation',

      function(p1, p2, p3, p4, theta) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.theta = theta;
      },

      function() {
        var v12 = this.p2.minus(this.p1);
        var a12 = Math.atan2(v12.y, v12.x);
        var m12 = this.p1.plus(this.p2).scaledBy(0.5);

        var v34 = this.p4.minus(this.p3);
        var a34 = Math.atan2(v34.y, v34.x);
        var m34 = this.p3.plus(this.p4).scaledBy(0.5);

        var currTheta = a12 - a34;
        var dTheta = this.theta - currTheta;
        // TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
        // and seems to make sense) results in jumpy/unstable behavior.

        this.p1.addDelta(m12.plus(this.p1.minus(m12).rotatedBy(dTheta)).minus(this.p1));
        this.p2.addDelta(m12.plus(this.p2.minus(m12).rotatedBy(dTheta)).minus(this.p2));

        this.p3.addDelta(m34.plus(this.p3.minus(m34).rotatedBy(-dTheta)).minus(this.p3));
        this.p4.addDelta(m34.plus(this.p4.minus(m34).rotatedBy(-dTheta)).minus(this.p4));
      }
  );

  Relax.declareConstraintType(
      'motor',

      function(p1, p2, w) {
        this.p1 = p1;
        this.p2 = p2;
        this.w = w;
        this.lastT = Date.now();
      },

      function(now) {
        var t = now - this.lastT;
        var dTheta = t * this.w * 2 * Math.PI / 1000;
        var m12 = this.p1.plus(this.p2).scaledBy(0.5);
        this.p1.addDelta(m12.plus(this.p1.minus(m12).rotatedBy(dTheta)).minus(this.p1));
        this.p2.addDelta(m12.plus(this.p2.minus(m12).rotatedBy(dTheta)).minus(this.p2));
        this.lastT = now;
      }
  );
}

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = installBuiltInConstraints;


},{"./Point.js":2}],4:[function(_dereq_,module,exports){
// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var Point = _dereq_('./Point.js');
var Constraint = _dereq_('./Constraint.js');
var installBuiltInConstraints = _dereq_('./installBuiltInConstraints.js');

// --------------------------------------------------------------------
// Meat
// --------------------------------------------------------------------

function Relax() {
  this.rho = 0.25;
  this.epsilon = 0.001;
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
  var didSomething;
  now = t0 = Date.now();
  do {
    didSomething = this.doOneIteration(now);
    now = Date.now();
    t = now - t0;
    count++;
  } while (didSomething && t < tMillis);
  return count;
};

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Relax;


},{"./Constraint.js":1,"./Point.js":2,"./installBuiltInConstraints.js":3}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4L3NyYy9Db25zdHJhaW50LmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4L3NyYy9Qb2ludC5qcyIsIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9zcmMvaW5zdGFsbEJ1aWx0SW5Db25zdHJhaW50cy5qcyIsIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIENvbnN0cmFpbnQoKSB7fVxuXG5Db25zdHJhaW50LnByb3RvdHlwZS5pbnZvbHZlc1BvaW50ID0gZnVuY3Rpb24ocCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiBPYmplY3Qua2V5cyh0aGlzKVxuICAgICAgLm1hcChmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHNlbGZba2V5XSA9PT0gcDsgfSlcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSB8fCBiOyB9KTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnN0cmFpbnQ7XG5cbiIsImZ1bmN0aW9uIHNxdWFyZSh4KSB7XG4gIHJldHVybiB4ICogeDtcbn1cblxuZnVuY3Rpb24gUG9pbnQoeCwgeSkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xufVxuXG5Qb2ludC5wcm90b3R5cGUucGx1cyA9IGZ1bmN0aW9uKHRoYXQpIHtcbiAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKyB0aGF0LngsIHRoaXMueSArIHRoYXQueSk7XG59O1xuXG5Qb2ludC5wcm90b3R5cGUubWludXMgPSBmdW5jdGlvbih0aGF0KSB7XG4gIHJldHVybiBuZXcgUG9pbnQodGhpcy54IC0gdGhhdC54LCB0aGlzLnkgLSB0aGF0LnkpO1xufTtcblxuUG9pbnQucHJvdG90eXBlLm5lZ2F0ZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2NhbGVkQnkoLTEpO1xufTtcblxuUG9pbnQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNjYWxlZEJ5KDEpO1xufTtcblxuUG9pbnQucHJvdG90eXBlLmNsZWFyRGVsdGEgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGVsdGEpIHtcbiAgICB0aGlzLmRlbHRhLnggPSB0aGlzLmRlbHRhLnkgPSAwO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGVsdGEgPSBuZXcgUG9pbnQoMCwgMCk7XG4gIH1cbn07XG5cblBvaW50LnByb3RvdHlwZS5hZGREZWx0YSA9IGZ1bmN0aW9uKGQpIHtcbiAgdGhpcy5kZWx0YS54ICs9IGQueDtcbiAgdGhpcy5kZWx0YS55ICs9IGQueTtcbn07XG5cbi8vIFRoZSBmb2xsb3dpbmcgbWV0aG9kcyBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB0aGUgUG9pbnQgcmVwcmVzZW50cyBhIHZlY3Rvci5cblxuUG9pbnQucHJvdG90eXBlLnNjYWxlZEJ5ID0gZnVuY3Rpb24obikge1xuICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIG4sIHRoaXMueSAqIG4pO1xufTtcblxuUG9pbnQucHJvdG90eXBlLm1hZ25pdHVkZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5zcXJ0KHNxdWFyZSh0aGlzLngpICsgc3F1YXJlKHRoaXMueSkpO1xufTtcblxuUG9pbnQucHJvdG90eXBlLm5vcm1hbGl6ZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2NhbGVkQnkoMSAvIHRoaXMubWFnbml0dWRlKCkpO1xufTtcblxuUG9pbnQucHJvdG90eXBlLnJvdGF0ZWRCeSA9IGZ1bmN0aW9uKGRUaGV0YSkge1xuICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKHRoaXMueSwgdGhpcy54KSArIGRUaGV0YTtcbiAgdmFyIG1hZyA9IHRoaXMubWFnbml0dWRlKCk7XG4gIHJldHVybiBuZXcgUG9pbnQobWFnICogTWF0aC5jb3ModGhldGEpLCBtYWcgKiBNYXRoLnNpbih0aGV0YSkpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEV4cG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnQ7XG5cbiIsIlBvaW50ID0gcmVxdWlyZSgnLi9Qb2ludC5qcycpO1xuXG5mdW5jdGlvbiBpbnN0YWxsQnVpbHRJbkNvbnN0cmFpbnRzKFJlbGF4KSB7XG4gIFJlbGF4LmRlY2xhcmVDb25zdHJhaW50VHlwZShcbiAgICAgICdjb29yZGluYXRlJyxcblxuICAgICAgZnVuY3Rpb24ocCwgeCwgeSkge1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgICAgICB0aGlzLmMgPSBuZXcgUG9pbnQoeCwgeSk7XG4gICAgICB9LFxuXG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wLmFkZERlbHRhKHRoaXMuYy5taW51cyh0aGlzLnApKTtcbiAgICAgIH1cbiAgKTtcblxuICBSZWxheC5kZWNsYXJlQ29uc3RyYWludFR5cGUoXG4gICAgICAnY29pbmNpZGVuY2UnLFxuXG4gICAgICBmdW5jdGlvbihwMSwgcDIpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxO1xuICAgICAgICB0aGlzLnAyID0gcDI7XG4gICAgICB9LFxuXG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGQgPSB0aGlzLnAyLm1pbnVzKHRoaXMucDEpLnNjYWxlZEJ5KDAuNSk7XG4gICAgICAgIHRoaXMucDEuYWRkRGVsdGEoZCk7XG4gICAgICAgIHRoaXMucDIuYWRkRGVsdGEoZC5uZWdhdGVkKCkpO1xuICAgICAgfVxuICApO1xuXG4gIFJlbGF4LmRlY2xhcmVDb25zdHJhaW50VHlwZShcbiAgICAgICdlcXVpdmFsZW5jZScsXG5cbiAgICAgIGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgIHRoaXMucDEgPSBwMTtcbiAgICAgICAgdGhpcy5wMiA9IHAyO1xuICAgICAgICB0aGlzLnAzID0gcDM7XG4gICAgICAgIHRoaXMucDQgPSBwNDtcbiAgICAgIH0sXG5cbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZDEgPSB0aGlzLnAyLnBsdXModGhpcy5wMykubWludXModGhpcy5wNCkubWludXModGhpcy5wMSkuc2NhbGVkQnkoMC4yNSk7XG4gICAgICAgIHRoaXMucDEuYWRkRGVsdGEoZDEpO1xuICAgICAgICB0aGlzLnA0LmFkZERlbHRhKGQxKTtcblxuICAgICAgICB2YXIgZDIgPSB0aGlzLnAxLnBsdXModGhpcy5wNCkubWludXModGhpcy5wMikubWludXModGhpcy5wMykuc2NhbGVkQnkoMC4yNSk7XG4gICAgICAgIHRoaXMucDIuYWRkRGVsdGEoZDIpO1xuICAgICAgICB0aGlzLnAzLmFkZERlbHRhKGQyKTtcbiAgICAgIH1cbiAgKTtcblxuICBSZWxheC5kZWNsYXJlQ29uc3RyYWludFR5cGUoXG4gICAgICAnZXFkaXN0JyxcblxuICAgICAgZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxO1xuICAgICAgICB0aGlzLnAyID0gcDI7XG4gICAgICAgIHRoaXMucDMgPSBwMztcbiAgICAgICAgdGhpcy5wNCA9IHA0O1xuICAgICAgfSxcblxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsMTIgPSB0aGlzLnAxLm1pbnVzKHRoaXMucDIpLm1hZ25pdHVkZSgpO1xuICAgICAgICB2YXIgbDM0ID0gdGhpcy5wMy5taW51cyh0aGlzLnA0KS5tYWduaXR1ZGUoKTtcbiAgICAgICAgdmFyIGRlbHRhID0gKGwxMiAtIGwzNCkgLyA0O1xuICAgICAgICB2YXIgZTEyID0gdGhpcy5wMi5taW51cyh0aGlzLnAxKS5ub3JtYWxpemVkKCk7XG4gICAgICAgIHZhciBlMzQgPSB0aGlzLnA0Lm1pbnVzKHRoaXMucDMpLm5vcm1hbGl6ZWQoKTtcblxuICAgICAgICB0aGlzLnAxLmFkZERlbHRhKGUxMi5zY2FsZWRCeShkZWx0YSkpO1xuICAgICAgICB0aGlzLnAyLmFkZERlbHRhKGUxMi5zY2FsZWRCeSgtZGVsdGEpKTtcbiAgICAgICAgdGhpcy5wMy5hZGREZWx0YShlMzQuc2NhbGVkQnkoLWRlbHRhKSk7XG4gICAgICAgIHRoaXMucDQuYWRkRGVsdGEoZTM0LnNjYWxlZEJ5KGRlbHRhKSk7XG4gICAgICB9XG4gICk7XG5cbiAgUmVsYXguZGVjbGFyZUNvbnN0cmFpbnRUeXBlKFxuICAgICAgJ2xlbmd0aCcsXG5cbiAgICAgIGZ1bmN0aW9uKHAxLCBwMiwgbCkge1xuICAgICAgICB0aGlzLnAxID0gcDE7XG4gICAgICAgIHRoaXMucDIgPSBwMjtcbiAgICAgICAgdGhpcy5sID0gbDtcbiAgICAgIH0sXG5cbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbDEyID0gdGhpcy5wMS5taW51cyh0aGlzLnAyKS5tYWduaXR1ZGUoKTtcbiAgICAgICAgdmFyIGRlbHRhID0gKGwxMiAtIHRoaXMubCkgLyAyO1xuICAgICAgICB2YXIgZTEyID0gdGhpcy5wMi5taW51cyh0aGlzLnAxKS5ub3JtYWxpemVkKCk7XG5cbiAgICAgICAgdmFyIGQgPSBlMTIuc2NhbGVkQnkoZGVsdGEpO1xuICAgICAgICB0aGlzLnAxLmFkZERlbHRhKGQpO1xuICAgICAgICB0aGlzLnAyLmFkZERlbHRhKGQubmVnYXRlZCgpKTtcbiAgICAgIH1cbiAgKTtcblxuICBSZWxheC5kZWNsYXJlQ29uc3RyYWludFR5cGUoXG4gICAgICAnb3JpZW50YXRpb24nLFxuXG4gICAgICBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCwgdGhldGEpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxO1xuICAgICAgICB0aGlzLnAyID0gcDI7XG4gICAgICAgIHRoaXMucDMgPSBwMztcbiAgICAgICAgdGhpcy5wNCA9IHA0O1xuICAgICAgICB0aGlzLnRoZXRhID0gdGhldGE7XG4gICAgICB9LFxuXG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHYxMiA9IHRoaXMucDIubWludXModGhpcy5wMSk7XG4gICAgICAgIHZhciBhMTIgPSBNYXRoLmF0YW4yKHYxMi55LCB2MTIueCk7XG4gICAgICAgIHZhciBtMTIgPSB0aGlzLnAxLnBsdXModGhpcy5wMikuc2NhbGVkQnkoMC41KTtcblxuICAgICAgICB2YXIgdjM0ID0gdGhpcy5wNC5taW51cyh0aGlzLnAzKTtcbiAgICAgICAgdmFyIGEzNCA9IE1hdGguYXRhbjIodjM0LnksIHYzNC54KTtcbiAgICAgICAgdmFyIG0zNCA9IHRoaXMucDMucGx1cyh0aGlzLnA0KS5zY2FsZWRCeSgwLjUpO1xuXG4gICAgICAgIHZhciBjdXJyVGhldGEgPSBhMTIgLSBhMzQ7XG4gICAgICAgIHZhciBkVGhldGEgPSB0aGlzLnRoZXRhIC0gY3VyclRoZXRhO1xuICAgICAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IHdoeSBzZXR0aW5nIGRUaGV0YSB0byAxLzIgdGltZXMgdGhpcyB2YWx1ZSAoYXMgc2hvd24gaW4gdGhlIHBhcGVyXG4gICAgICAgIC8vIGFuZCBzZWVtcyB0byBtYWtlIHNlbnNlKSByZXN1bHRzIGluIGp1bXB5L3Vuc3RhYmxlIGJlaGF2aW9yLlxuXG4gICAgICAgIHRoaXMucDEuYWRkRGVsdGEobTEyLnBsdXModGhpcy5wMS5taW51cyhtMTIpLnJvdGF0ZWRCeShkVGhldGEpKS5taW51cyh0aGlzLnAxKSk7XG4gICAgICAgIHRoaXMucDIuYWRkRGVsdGEobTEyLnBsdXModGhpcy5wMi5taW51cyhtMTIpLnJvdGF0ZWRCeShkVGhldGEpKS5taW51cyh0aGlzLnAyKSk7XG5cbiAgICAgICAgdGhpcy5wMy5hZGREZWx0YShtMzQucGx1cyh0aGlzLnAzLm1pbnVzKG0zNCkucm90YXRlZEJ5KC1kVGhldGEpKS5taW51cyh0aGlzLnAzKSk7XG4gICAgICAgIHRoaXMucDQuYWRkRGVsdGEobTM0LnBsdXModGhpcy5wNC5taW51cyhtMzQpLnJvdGF0ZWRCeSgtZFRoZXRhKSkubWludXModGhpcy5wNCkpO1xuICAgICAgfVxuICApO1xuXG4gIFJlbGF4LmRlY2xhcmVDb25zdHJhaW50VHlwZShcbiAgICAgICdtb3RvcicsXG5cbiAgICAgIGZ1bmN0aW9uKHAxLCBwMiwgdykge1xuICAgICAgICB0aGlzLnAxID0gcDE7XG4gICAgICAgIHRoaXMucDIgPSBwMjtcbiAgICAgICAgdGhpcy53ID0gdztcbiAgICAgICAgdGhpcy5sYXN0VCA9IERhdGUubm93KCk7XG4gICAgICB9LFxuXG4gICAgICBmdW5jdGlvbihub3cpIHtcbiAgICAgICAgdmFyIHQgPSBub3cgLSB0aGlzLmxhc3RUO1xuICAgICAgICB2YXIgZFRoZXRhID0gdCAqIHRoaXMudyAqIDIgKiBNYXRoLlBJIC8gMTAwMDtcbiAgICAgICAgdmFyIG0xMiA9IHRoaXMucDEucGx1cyh0aGlzLnAyKS5zY2FsZWRCeSgwLjUpO1xuICAgICAgICB0aGlzLnAxLmFkZERlbHRhKG0xMi5wbHVzKHRoaXMucDEubWludXMobTEyKS5yb3RhdGVkQnkoZFRoZXRhKSkubWludXModGhpcy5wMSkpO1xuICAgICAgICB0aGlzLnAyLmFkZERlbHRhKG0xMi5wbHVzKHRoaXMucDIubWludXMobTEyKS5yb3RhdGVkQnkoZFRoZXRhKSkubWludXModGhpcy5wMikpO1xuICAgICAgICB0aGlzLmxhc3RUID0gbm93O1xuICAgICAgfVxuICApO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQnVpbHRJbkNvbnN0cmFpbnRzO1xuXG4iLCIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW1wb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9Qb2ludC5qcycpO1xudmFyIENvbnN0cmFpbnQgPSByZXF1aXJlKCcuL0NvbnN0cmFpbnQuanMnKTtcbnZhciBpbnN0YWxsQnVpbHRJbkNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9pbnN0YWxsQnVpbHRJbkNvbnN0cmFpbnRzLmpzJyk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBNZWF0XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBSZWxheCgpIHtcbiAgdGhpcy5yaG8gPSAwLjI1O1xuICB0aGlzLmVwc2lsb24gPSAwLjAwMTtcbiAgdGhpcy5wb2ludHMgPSBbXTtcbiAgdGhpcy5jb25zdHJhaW50cyA9IFtdO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgY29uc3RyYWludFR5cGVzID0ge307XG5cblJlbGF4LmRlY2xhcmVDb25zdHJhaW50VHlwZSA9IGZ1bmN0aW9uKG5hbWUsIGN0b3IsIGFkZERlbHRhc0ZuKSB7XG4gIGNvbnN0cmFpbnRUeXBlc1tuYW1lXSA9IGN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gbmV3IENvbnN0cmFpbnQoKTtcbiAgY3Rvci5wcm90b3R5cGUuYWRkRGVsdGFzID0gYWRkRGVsdGFzRm47XG59XG5cblJlbGF4LmdldENvbnN0cmFpbnRUeXBlID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAoY29uc3RyYWludFR5cGVzW25hbWVdKSB7XG4gICAgcmV0dXJuIGNvbnN0cmFpbnRUeXBlc1tuYW1lXTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyAndW5rbm93biBjb25zdHJhaW50IHR5cGUgJyArIG5hbWU7XG4gIH1cbn07XG5cbmluc3RhbGxCdWlsdEluQ29uc3RyYWludHMoUmVsYXgpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5SZWxheC5wcm90b3R5cGUuYWRkUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHZhciBwID0gbmV3IFBvaW50KHgsIHkpO1xuICB0aGlzLnBvaW50cy5wdXNoKHApO1xuICByZXR1cm4gcDtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5yZW1vdmVQb2ludCA9IGZ1bmN0aW9uKHVud2FudGVkKSB7XG4gIHRoaXMucG9pbnRzID0gdGhpcy5wb2ludHMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAgIT09IHVud2FudGVkOyB9KTtcbiAgdGhpcy5jb25zdHJhaW50cyA9IHRoaXMuY29uc3RyYWludHMuZmlsdGVyKGZ1bmN0aW9uKGMpIHsgcmV0dXJuICFjLmludm9sdmVzUG9pbnQodW53YW50ZWQpOyB9KTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5hZGRDb25zdHJhaW50ID0gZnVuY3Rpb24odHlwZSAvKiBhcmcxLCBhcmcyLCAuLi4gKi8pIHtcbiAgdmFyIGN0b3IgPSBSZWxheC5nZXRDb25zdHJhaW50VHlwZSh0eXBlKTtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBpZiAoYXJncy5sZW5ndGggLSAxICE9PSBjdG9yLmxlbmd0aCkge1xuICAgIHRocm93IFsnd3JvbmcgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byAnLCB0eXBlLCAnIGNvbnN0cnVjdG9yICcsXG4gICAgICAgICAgICcoZXhwZWN0ZWQgJywgY3Rvci5sZW5ndGgsICcgYnV0IGdvdCAnLCBhcmdzLmxlbmd0aCAtIDEsICcpJ10uam9pbignJyk7XG4gIH1cbiAgdmFyIG5vQXJnQ3RvciA9IGN0b3IuYmluZC5hcHBseShjdG9yLCBhcmdzKTtcbiAgdmFyIGMgPSBuZXcgbm9BcmdDdG9yKCk7XG4gIHRoaXMuY29uc3RyYWludHMucHVzaChjKTtcbiAgcmV0dXJuIGM7XG59O1xuXG5SZWxheC5wcm90b3R5cGUucmVtb3ZlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHVud2FudGVkKSB7XG4gIHRoaXMuY29uc3RyYWludHMgPSB0aGlzLmNvbnN0cmFpbnRzLmZpbHRlcihmdW5jdGlvbihjKSB7IHJldHVybiBjICE9PSB1bndhbnRlZDsgfSk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbih0KSB7XG4gIGlmICh0aGlzLmJlZm9yZUVhY2hJdGVyYXRpb24pIHtcbiAgICAodGhpcy5iZWZvcmVFYWNoSXRlcmF0aW9uKSgpO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApIHsgcC5jbGVhckRlbHRhKCk7IH0pO1xuICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24oYykgeyBjLmFkZERlbHRhcyh0KTsgfSk7XG4gIHZhciBkaWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgdGhpcy5wb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgZGlkU29tZXRoaW5nIHw9IHAuZGVsdGEueCA+IHNlbGYuZXBzaWxvbiB8fCBwLmRlbHRhLnkgPiBzZWxmLmVwc2lsb247XG4gIH0pO1xuICBpZiAoZGlkU29tZXRoaW5nKSB7XG4gICAgdGhpcy5wb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICBwLnggKz0gc2VsZi5yaG8gKiBwLmRlbHRhLng7XG4gICAgICBwLnkgKz0gc2VsZi5yaG8gKiBwLmRlbHRhLnk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5SZWxheC5wcm90b3R5cGUuaXRlcmF0ZUZvclVwVG9NaWxsaXMgPSBmdW5jdGlvbih0TWlsbGlzKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIHZhciBub3csIHQwLCB0O1xuICB2YXIgZGlkU29tZXRoaW5nO1xuICBub3cgPSB0MCA9IERhdGUubm93KCk7XG4gIGRvIHtcbiAgICBkaWRTb21ldGhpbmcgPSB0aGlzLmRvT25lSXRlcmF0aW9uKG5vdyk7XG4gICAgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB0ID0gbm93IC0gdDA7XG4gICAgY291bnQrKztcbiAgfSB3aGlsZSAoZGlkU29tZXRoaW5nICYmIHQgPCB0TWlsbGlzKTtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEV4cG9ydHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0gUmVsYXg7XG5cbiJdfQ==
(4)
});
