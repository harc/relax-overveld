funciton RelaxCanvas(relax, canvas) {
  this.relax = relax;
  this.paused = false;
  this.pointRadius = 8;
  this.initCtxt(canvas);
  this.points = [
      relax.addPoint(100, 100), relax.addPoint(200, 200), relax.addPoint(300, 300)
  ];
  this.constraints = [
      relax.addConstraint('length', points[0], points[1], 100),
      relax.addConstraint('length', points[1], points[2], 100)
  ];

  this.stepFn = this.step.bind(this);
  this.step();
}

RelaxCanvas.prototype.initCtxt = function(canvas) {
  this.ctxt = canvas.getContext('2d');
  ctxt.font = '12px Arial';
  ctxt.shadowOffsetX = 1;
  ctxt.shadowOffsetY = 1;
  ctxt.shadowColor = '#999';
  ctxt.shadowBlur = 1;
};

RelaxCanvas.prototype.drawPoint = function(p) {
  this.ctxt.fillStyle = 'slateblue';
  this.ctxt.beginPath();
  this.ctxt.arc(p.x, p.y, this.pointRadius, 0, 2 * Math.PI);
  this.ctxt.closePath()
  this.ctxt.fill();
  this.ctxt.stroke();
};

RelaxCanvas.prototype.redraw = function() {
  var self = this;
  ctxt.fillStyle = 'white';
  ctxt.fillRect(0, 0, canvas.width, canvas.height);
  this.points.forEach(function(p) { self.drawPoint(p); });
};

RelaxCanvas.prototype.step = function() {
  this.relax.doOneIteration();
  this.redraw();
  if (!this.paused) {
    requestAnimationFrame(this.stepFn);
  }
};

RelaxCanvas.prototype.pause = function() {
  this.paused = true;
};

RelaxCanvas.prototype.resume = function() {
  this.paused = false;
  this.step();
};

