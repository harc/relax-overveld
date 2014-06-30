examples.rod = function() {
  var p1 = relax.addPoint(200, 200);
  var p2 = relax.addPoint(300,  200);
  var p3 = relax.addPoint(400,  200);

  relax.addLine(p1, p2);
  relax.addLine(p2, p3);

  relax.addEquivalenceConstraint(p1, p2, p2, p3);
  relax.addLengthConstraint(p1, p3, 200);
};

