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

