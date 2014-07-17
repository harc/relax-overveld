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

