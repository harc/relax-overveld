examples.rod = function() {
  var p1 = rc.addPoint(200, 200);
  var p2 = rc.addPoint(300,  200);
  var p3 = rc.addPoint(400,  200);

  rc.addLine(p1, p2);
  rc.addLine(p2, p3);

  rc.addEquivalenceConstraint(p1, p2, p2, p3);
  rc.addLengthConstraint(p1, p3, 200);
};

