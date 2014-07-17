examples['lazy tongs'] = function() {
  var p1  = rc.addPoint(200, 100);
  var p2  = rc.addPoint(400, 100);
  var p3  = rc.addPoint(600, 100);
  var p4  = rc.addPoint(800, 100);
  var p5  = rc.addPoint(300, 200);
  var p6  = rc.addPoint(500, 200);
  var p7  = rc.addPoint(700, 200);
  var p8  = rc.addPoint(200, 300);
  var p9  = rc.addPoint(400, 300);
  var p10 = rc.addPoint(600, 300);
  var p11 = rc.addPoint(800, 300);

  rc.addLine(p1,  p9);
  rc.addLine(p9,  p3);
  rc.addLine(p3,  p11);
  rc.addLine(p8,  p2);
  rc.addLine(p2,  p10);
  rc.addLine(p10, p4);

  rc.addCoordinateConstraint(p1, p1.x, p1.y);

  rc.addLengthConstraint(p1,  p5, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p2,  p6, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p3,  p7, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p8,  p5, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p9,  p6, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p10, p7, 100 * Math.sqrt(2));

  rc.addLengthConstraint(p5, p9,  100 * Math.sqrt(2));
  rc.addLengthConstraint(p6, p10, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p7, p11, 100 * Math.sqrt(2));
  rc.addLengthConstraint(p5, p2,  100 * Math.sqrt(2));
  rc.addLengthConstraint(p6, p3,  100 * Math.sqrt(2));
  rc.addLengthConstraint(p7, p4,  100 * Math.sqrt(2));

  rc.addEquivalenceConstraint(p1,  p5, p5, p9);
  rc.addEquivalenceConstraint(p2,  p6, p6, p10);
  rc.addEquivalenceConstraint(p3,  p7, p7, p11);
  rc.addEquivalenceConstraint(p8,  p5, p5, p2);
  rc.addEquivalenceConstraint(p9,  p6, p6, p3);
  rc.addEquivalenceConstraint(p10, p7, p7, p4);

  rc.addEquivalenceConstraint(p1, p2, p2, p3);
  rc.addEquivalenceConstraint(p2, p3, p3, p4);
  rc.addEquivalenceConstraint(p5, p6, p6, p7);
};

