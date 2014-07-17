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

      function() {
        var now = Date.now();
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
  this.paused = false;
  this.oneIterationPerFrame = false;
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

Relax.prototype.doOneIteration = function() {
  var self = this;
  this.points.forEach(function(p) { p.clearDelta(); });
  this.constraints.forEach(function(c) { c.addDeltas(); });
  this.points.forEach(function(p) {
    p.x += self.rho * p.delta.x;
    p.y += self.rho * p.delta.y;
  });
};

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = Relax;


},{"./Constraint.js":1,"./Point.js":2,"./installBuiltInConstraints.js":3}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4L3NyYy9Db25zdHJhaW50LmpzIiwiL1VzZXJzL2F3YXJ0aC9wcm9nL3JlbGF4L3NyYy9Qb2ludC5qcyIsIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9zcmMvaW5zdGFsbEJ1aWx0SW5Db25zdHJhaW50cy5qcyIsIi9Vc2Vycy9hd2FydGgvcHJvZy9yZWxheC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBDb25zdHJhaW50KCkge31cblxuQ29uc3RyYWludC5wcm90b3R5cGUuaW52b2x2ZXNQb2ludCA9IGZ1bmN0aW9uKHApIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICByZXR1cm4gT2JqZWN0LmtleXModGhpcylcbiAgICAgIC5tYXAoZnVuY3Rpb24oa2V5KSB7IHJldHVybiBzZWxmW2tleV0gPT09IHA7IH0pXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgfHwgYjsgfSk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBDb25zdHJhaW50O1xuXG4iLCJmdW5jdGlvbiBzcXVhcmUoeCkge1xuICByZXR1cm4geCAqIHg7XG59XG5cbmZ1bmN0aW9uIFBvaW50KHgsIHkpIHtcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcbn1cblxuUG9pbnQucHJvdG90eXBlLnBsdXMgPSBmdW5jdGlvbih0aGF0KSB7XG4gIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICsgdGhhdC54LCB0aGlzLnkgKyB0aGF0LnkpO1xufTtcblxuUG9pbnQucHJvdG90eXBlLm1pbnVzID0gZnVuY3Rpb24odGhhdCkge1xuICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAtIHRoYXQueCwgdGhpcy55IC0gdGhhdC55KTtcbn07XG5cblBvaW50LnByb3RvdHlwZS5uZWdhdGVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNjYWxlZEJ5KC0xKTtcbn07XG5cblBvaW50LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zY2FsZWRCeSgxKTtcbn07XG5cblBvaW50LnByb3RvdHlwZS5jbGVhckRlbHRhID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRlbHRhKSB7XG4gICAgdGhpcy5kZWx0YS54ID0gdGhpcy5kZWx0YS55ID0gMDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRlbHRhID0gbmV3IFBvaW50KDAsIDApO1xuICB9XG59O1xuXG5Qb2ludC5wcm90b3R5cGUuYWRkRGVsdGEgPSBmdW5jdGlvbihkKSB7XG4gIHRoaXMuZGVsdGEueCArPSBkLng7XG4gIHRoaXMuZGVsdGEueSArPSBkLnk7XG59O1xuXG4vLyBUaGUgZm9sbG93aW5nIG1ldGhvZHMgb25seSBtYWtlIHNlbnNlIHdoZW4gdGhlIFBvaW50IHJlcHJlc2VudHMgYSB2ZWN0b3IuXG5cblBvaW50LnByb3RvdHlwZS5zY2FsZWRCeSA9IGZ1bmN0aW9uKG4pIHtcbiAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiBuLCB0aGlzLnkgKiBuKTtcbn07XG5cblBvaW50LnByb3RvdHlwZS5tYWduaXR1ZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGguc3FydChzcXVhcmUodGhpcy54KSArIHNxdWFyZSh0aGlzLnkpKTtcbn07XG5cblBvaW50LnByb3RvdHlwZS5ub3JtYWxpemVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNjYWxlZEJ5KDEgLyB0aGlzLm1hZ25pdHVkZSgpKTtcbn07XG5cblBvaW50LnByb3RvdHlwZS5yb3RhdGVkQnkgPSBmdW5jdGlvbihkVGhldGEpIHtcbiAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMih0aGlzLnksIHRoaXMueCkgKyBkVGhldGE7XG4gIHZhciBtYWcgPSB0aGlzLm1hZ25pdHVkZSgpO1xuICByZXR1cm4gbmV3IFBvaW50KG1hZyAqIE1hdGguY29zKHRoZXRhKSwgbWFnICogTWF0aC5zaW4odGhldGEpKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50O1xuXG4iLCJQb2ludCA9IHJlcXVpcmUoJy4vUG9pbnQuanMnKTtcblxuZnVuY3Rpb24gaW5zdGFsbEJ1aWx0SW5Db25zdHJhaW50cyhSZWxheCkge1xuICBSZWxheC5kZWNsYXJlQ29uc3RyYWludFR5cGUoXG4gICAgICAnY29vcmRpbmF0ZScsXG5cbiAgICAgIGZ1bmN0aW9uKHAsIHgsIHkpIHtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICAgICAgdGhpcy5jID0gbmV3IFBvaW50KHgsIHkpO1xuICAgICAgfSxcblxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucC5hZGREZWx0YSh0aGlzLmMubWludXModGhpcy5wKSk7XG4gICAgICB9XG4gICk7XG5cbiAgUmVsYXguZGVjbGFyZUNvbnN0cmFpbnRUeXBlKFxuICAgICAgJ2NvaW5jaWRlbmNlJyxcblxuICAgICAgZnVuY3Rpb24ocDEsIHAyKSB7XG4gICAgICAgIHRoaXMucDEgPSBwMTtcbiAgICAgICAgdGhpcy5wMiA9IHAyO1xuICAgICAgfSxcblxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkID0gdGhpcy5wMi5taW51cyh0aGlzLnAxKS5zY2FsZWRCeSgwLjUpO1xuICAgICAgICB0aGlzLnAxLmFkZERlbHRhKGQpO1xuICAgICAgICB0aGlzLnAyLmFkZERlbHRhKGQubmVnYXRlZCgpKTtcbiAgICAgIH1cbiAgKTtcblxuICBSZWxheC5kZWNsYXJlQ29uc3RyYWludFR5cGUoXG4gICAgICAnZXF1aXZhbGVuY2UnLFxuXG4gICAgICBmdW5jdGlvbihwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICB0aGlzLnAxID0gcDE7XG4gICAgICAgIHRoaXMucDIgPSBwMjtcbiAgICAgICAgdGhpcy5wMyA9IHAzO1xuICAgICAgICB0aGlzLnA0ID0gcDQ7XG4gICAgICB9LFxuXG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGQxID0gdGhpcy5wMi5wbHVzKHRoaXMucDMpLm1pbnVzKHRoaXMucDQpLm1pbnVzKHRoaXMucDEpLnNjYWxlZEJ5KDAuMjUpO1xuICAgICAgICB0aGlzLnAxLmFkZERlbHRhKGQxKTtcbiAgICAgICAgdGhpcy5wNC5hZGREZWx0YShkMSk7XG5cbiAgICAgICAgdmFyIGQyID0gdGhpcy5wMS5wbHVzKHRoaXMucDQpLm1pbnVzKHRoaXMucDIpLm1pbnVzKHRoaXMucDMpLnNjYWxlZEJ5KDAuMjUpO1xuICAgICAgICB0aGlzLnAyLmFkZERlbHRhKGQyKTtcbiAgICAgICAgdGhpcy5wMy5hZGREZWx0YShkMik7XG4gICAgICB9XG4gICk7XG5cbiAgUmVsYXguZGVjbGFyZUNvbnN0cmFpbnRUeXBlKFxuICAgICAgJ2VxZGlzdCcsXG5cbiAgICAgIGZ1bmN0aW9uKHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgIHRoaXMucDEgPSBwMTtcbiAgICAgICAgdGhpcy5wMiA9IHAyO1xuICAgICAgICB0aGlzLnAzID0gcDM7XG4gICAgICAgIHRoaXMucDQgPSBwNDtcbiAgICAgIH0sXG5cbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbDEyID0gdGhpcy5wMS5taW51cyh0aGlzLnAyKS5tYWduaXR1ZGUoKTtcbiAgICAgICAgdmFyIGwzNCA9IHRoaXMucDMubWludXModGhpcy5wNCkubWFnbml0dWRlKCk7XG4gICAgICAgIHZhciBkZWx0YSA9IChsMTIgLSBsMzQpIC8gNDtcbiAgICAgICAgdmFyIGUxMiA9IHRoaXMucDIubWludXModGhpcy5wMSkubm9ybWFsaXplZCgpO1xuICAgICAgICB2YXIgZTM0ID0gdGhpcy5wNC5taW51cyh0aGlzLnAzKS5ub3JtYWxpemVkKCk7XG5cbiAgICAgICAgdGhpcy5wMS5hZGREZWx0YShlMTIuc2NhbGVkQnkoZGVsdGEpKTtcbiAgICAgICAgdGhpcy5wMi5hZGREZWx0YShlMTIuc2NhbGVkQnkoLWRlbHRhKSk7XG4gICAgICAgIHRoaXMucDMuYWRkRGVsdGEoZTM0LnNjYWxlZEJ5KC1kZWx0YSkpO1xuICAgICAgICB0aGlzLnA0LmFkZERlbHRhKGUzNC5zY2FsZWRCeShkZWx0YSkpO1xuICAgICAgfVxuICApO1xuXG4gIFJlbGF4LmRlY2xhcmVDb25zdHJhaW50VHlwZShcbiAgICAgICdsZW5ndGgnLFxuXG4gICAgICBmdW5jdGlvbihwMSwgcDIsIGwpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxO1xuICAgICAgICB0aGlzLnAyID0gcDI7XG4gICAgICAgIHRoaXMubCA9IGw7XG4gICAgICB9LFxuXG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGwxMiA9IHRoaXMucDEubWludXModGhpcy5wMikubWFnbml0dWRlKCk7XG4gICAgICAgIHZhciBkZWx0YSA9IChsMTIgLSB0aGlzLmwpIC8gMjtcbiAgICAgICAgdmFyIGUxMiA9IHRoaXMucDIubWludXModGhpcy5wMSkubm9ybWFsaXplZCgpO1xuXG4gICAgICAgIHZhciBkID0gZTEyLnNjYWxlZEJ5KGRlbHRhKTtcbiAgICAgICAgdGhpcy5wMS5hZGREZWx0YShkKTtcbiAgICAgICAgdGhpcy5wMi5hZGREZWx0YShkLm5lZ2F0ZWQoKSk7XG4gICAgICB9XG4gICk7XG5cbiAgUmVsYXguZGVjbGFyZUNvbnN0cmFpbnRUeXBlKFxuICAgICAgJ29yaWVudGF0aW9uJyxcblxuICAgICAgZnVuY3Rpb24ocDEsIHAyLCBwMywgcDQsIHRoZXRhKSB7XG4gICAgICAgIHRoaXMucDEgPSBwMTtcbiAgICAgICAgdGhpcy5wMiA9IHAyO1xuICAgICAgICB0aGlzLnAzID0gcDM7XG4gICAgICAgIHRoaXMucDQgPSBwNDtcbiAgICAgICAgdGhpcy50aGV0YSA9IHRoZXRhO1xuICAgICAgfSxcblxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2MTIgPSB0aGlzLnAyLm1pbnVzKHRoaXMucDEpO1xuICAgICAgICB2YXIgYTEyID0gTWF0aC5hdGFuMih2MTIueSwgdjEyLngpO1xuICAgICAgICB2YXIgbTEyID0gdGhpcy5wMS5wbHVzKHRoaXMucDIpLnNjYWxlZEJ5KDAuNSk7XG5cbiAgICAgICAgdmFyIHYzNCA9IHRoaXMucDQubWludXModGhpcy5wMyk7XG4gICAgICAgIHZhciBhMzQgPSBNYXRoLmF0YW4yKHYzNC55LCB2MzQueCk7XG4gICAgICAgIHZhciBtMzQgPSB0aGlzLnAzLnBsdXModGhpcy5wNCkuc2NhbGVkQnkoMC41KTtcblxuICAgICAgICB2YXIgY3VyclRoZXRhID0gYTEyIC0gYTM0O1xuICAgICAgICB2YXIgZFRoZXRhID0gdGhpcy50aGV0YSAtIGN1cnJUaGV0YTtcbiAgICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aHkgc2V0dGluZyBkVGhldGEgdG8gMS8yIHRpbWVzIHRoaXMgdmFsdWUgKGFzIHNob3duIGluIHRoZSBwYXBlclxuICAgICAgICAvLyBhbmQgc2VlbXMgdG8gbWFrZSBzZW5zZSkgcmVzdWx0cyBpbiBqdW1weS91bnN0YWJsZSBiZWhhdmlvci5cblxuICAgICAgICB0aGlzLnAxLmFkZERlbHRhKG0xMi5wbHVzKHRoaXMucDEubWludXMobTEyKS5yb3RhdGVkQnkoZFRoZXRhKSkubWludXModGhpcy5wMSkpO1xuICAgICAgICB0aGlzLnAyLmFkZERlbHRhKG0xMi5wbHVzKHRoaXMucDIubWludXMobTEyKS5yb3RhdGVkQnkoZFRoZXRhKSkubWludXModGhpcy5wMikpO1xuXG4gICAgICAgIHRoaXMucDMuYWRkRGVsdGEobTM0LnBsdXModGhpcy5wMy5taW51cyhtMzQpLnJvdGF0ZWRCeSgtZFRoZXRhKSkubWludXModGhpcy5wMykpO1xuICAgICAgICB0aGlzLnA0LmFkZERlbHRhKG0zNC5wbHVzKHRoaXMucDQubWludXMobTM0KS5yb3RhdGVkQnkoLWRUaGV0YSkpLm1pbnVzKHRoaXMucDQpKTtcbiAgICAgIH1cbiAgKTtcblxuICBSZWxheC5kZWNsYXJlQ29uc3RyYWludFR5cGUoXG4gICAgICAnbW90b3InLFxuXG4gICAgICBmdW5jdGlvbihwMSwgcDIsIHcpIHtcbiAgICAgICAgdGhpcy5wMSA9IHAxO1xuICAgICAgICB0aGlzLnAyID0gcDI7XG4gICAgICAgIHRoaXMudyA9IHc7XG4gICAgICAgIHRoaXMubGFzdFQgPSBEYXRlLm5vdygpO1xuICAgICAgfSxcblxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgdCA9IG5vdyAtIHRoaXMubGFzdFQ7XG4gICAgICAgIHZhciBkVGhldGEgPSB0ICogdGhpcy53ICogMiAqIE1hdGguUEkgLyAxMDAwO1xuICAgICAgICB2YXIgbTEyID0gdGhpcy5wMS5wbHVzKHRoaXMucDIpLnNjYWxlZEJ5KDAuNSk7XG4gICAgICAgIHRoaXMucDEuYWRkRGVsdGEobTEyLnBsdXModGhpcy5wMS5taW51cyhtMTIpLnJvdGF0ZWRCeShkVGhldGEpKS5taW51cyh0aGlzLnAxKSk7XG4gICAgICAgIHRoaXMucDIuYWRkRGVsdGEobTEyLnBsdXModGhpcy5wMi5taW51cyhtMTIpLnJvdGF0ZWRCeShkVGhldGEpKS5taW51cyh0aGlzLnAyKSk7XG4gICAgICAgIHRoaXMubGFzdFQgPSBub3c7XG4gICAgICB9XG4gICk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxCdWlsdEluQ29uc3RyYWludHM7XG5cbiIsIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJbXBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL1BvaW50LmpzJyk7XG52YXIgQ29uc3RyYWludCA9IHJlcXVpcmUoJy4vQ29uc3RyYWludC5qcycpO1xudmFyIGluc3RhbGxCdWlsdEluQ29uc3RyYWludHMgPSByZXF1aXJlKCcuL2luc3RhbGxCdWlsdEluQ29uc3RyYWludHMuanMnKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIE1lYXRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIFJlbGF4KCkge1xuICB0aGlzLnJobyA9IDAuMjU7XG4gIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gIHRoaXMub25lSXRlcmF0aW9uUGVyRnJhbWUgPSBmYWxzZTtcbiAgdGhpcy5wb2ludHMgPSBbXTtcbiAgdGhpcy5jb25zdHJhaW50cyA9IFtdO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgY29uc3RyYWludFR5cGVzID0ge307XG5cblJlbGF4LmRlY2xhcmVDb25zdHJhaW50VHlwZSA9IGZ1bmN0aW9uKG5hbWUsIGN0b3IsIGFkZERlbHRhc0ZuKSB7XG4gIGNvbnN0cmFpbnRUeXBlc1tuYW1lXSA9IGN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gbmV3IENvbnN0cmFpbnQoKTtcbiAgY3Rvci5wcm90b3R5cGUuYWRkRGVsdGFzID0gYWRkRGVsdGFzRm47XG59XG5cblJlbGF4LmdldENvbnN0cmFpbnRUeXBlID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAoY29uc3RyYWludFR5cGVzW25hbWVdKSB7XG4gICAgcmV0dXJuIGNvbnN0cmFpbnRUeXBlc1tuYW1lXTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyAndW5rbm93biBjb25zdHJhaW50IHR5cGUgJyArIG5hbWU7XG4gIH1cbn07XG5cbmluc3RhbGxCdWlsdEluQ29uc3RyYWludHMoUmVsYXgpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5SZWxheC5wcm90b3R5cGUuYWRkUG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHZhciBwID0gbmV3IFBvaW50KHgsIHkpO1xuICB0aGlzLnBvaW50cy5wdXNoKHApO1xuICByZXR1cm4gcDtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5yZW1vdmVQb2ludCA9IGZ1bmN0aW9uKHVud2FudGVkKSB7XG4gIHRoaXMucG9pbnRzID0gdGhpcy5wb2ludHMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAgIT09IHVud2FudGVkOyB9KTtcbiAgdGhpcy5jb25zdHJhaW50cyA9IHRoaXMuY29uc3RyYWludHMuZmlsdGVyKGZ1bmN0aW9uKGMpIHsgcmV0dXJuICFjLmludm9sdmVzUG9pbnQodW53YW50ZWQpOyB9KTtcbn07XG5cblJlbGF4LnByb3RvdHlwZS5hZGRDb25zdHJhaW50ID0gZnVuY3Rpb24odHlwZSAvKiBhcmcxLCBhcmcyLCAuLi4gKi8pIHtcbiAgdmFyIGN0b3IgPSBSZWxheC5nZXRDb25zdHJhaW50VHlwZSh0eXBlKTtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBpZiAoYXJncy5sZW5ndGggLSAxICE9PSBjdG9yLmxlbmd0aCkge1xuICAgIHRocm93IFsnd3JvbmcgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byAnLCB0eXBlLCAnIGNvbnN0cnVjdG9yICcsXG4gICAgICAgICAgICcoZXhwZWN0ZWQgJywgY3Rvci5sZW5ndGgsICcgYnV0IGdvdCAnLCBhcmdzLmxlbmd0aCAtIDEsICcpJ10uam9pbignJyk7XG4gIH1cbiAgdmFyIG5vQXJnQ3RvciA9IGN0b3IuYmluZC5hcHBseShjdG9yLCBhcmdzKTtcbiAgdmFyIGMgPSBuZXcgbm9BcmdDdG9yKCk7XG4gIHRoaXMuY29uc3RyYWludHMucHVzaChjKTtcbiAgcmV0dXJuIGM7XG59O1xuXG5SZWxheC5wcm90b3R5cGUucmVtb3ZlQ29uc3RyYWludCA9IGZ1bmN0aW9uKHVud2FudGVkKSB7XG4gIHRoaXMuY29uc3RyYWludHMgPSB0aGlzLmNvbnN0cmFpbnRzLmZpbHRlcihmdW5jdGlvbihjKSB7IHJldHVybiBjICE9PSB1bndhbnRlZDsgfSk7XG59O1xuXG5SZWxheC5wcm90b3R5cGUuZG9PbmVJdGVyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApIHsgcC5jbGVhckRlbHRhKCk7IH0pO1xuICB0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24oYykgeyBjLmFkZERlbHRhcygpOyB9KTtcbiAgdGhpcy5wb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgcC54ICs9IHNlbGYucmhvICogcC5kZWx0YS54O1xuICAgIHAueSArPSBzZWxmLnJobyAqIHAuZGVsdGEueTtcbiAgfSk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWxheDtcblxuIl19
(4)
});
