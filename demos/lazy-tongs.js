examples['lazy tongs'] = function() {
  var p1  = relax.addPoint(200, 100, 'black');
  var p2  = relax.addPoint(400, 100);
  var p3  = relax.addPoint(600, 100);
  var p4  = relax.addPoint(800, 100);
  var p5  = relax.addPoint(300, 200);
  var p6  = relax.addPoint(500, 200);
  var p7  = relax.addPoint(700, 200);
  var p8  = relax.addPoint(200, 300);
  var p9  = relax.addPoint(400, 300);
  var p10 = relax.addPoint(600, 300);
  var p11 = relax.addPoint(800, 300);

  relax.addLine(p1,  p9);
  relax.addLine(p9,  p3);
  relax.addLine(p3,  p11);
  relax.addLine(p8,  p2);
  relax.addLine(p2,  p10);
  relax.addLine(p10, p4);

  relax.addCoordinateConstraint(p1, p1.clone());

  relax.addLengthConstraint(p1,  p5, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p2,  p6, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p3,  p7, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p8,  p5, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p9,  p6, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p10, p7, 100 * Math.sqrt(2));

  relax.addLengthConstraint(p5, p9,  100 * Math.sqrt(2));
  relax.addLengthConstraint(p6, p10, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p7, p11, 100 * Math.sqrt(2));
  relax.addLengthConstraint(p5, p2,  100 * Math.sqrt(2));
  relax.addLengthConstraint(p6, p3,  100 * Math.sqrt(2));
  relax.addLengthConstraint(p7, p4,  100 * Math.sqrt(2));

  relax.addEquivalenceConstraint(p1,  p5, p5, p9);
  relax.addEquivalenceConstraint(p2,  p6, p6, p10);
  relax.addEquivalenceConstraint(p3,  p7, p7, p11);
  relax.addEquivalenceConstraint(p8,  p5, p5, p2);
  relax.addEquivalenceConstraint(p9,  p6, p6, p3);
  relax.addEquivalenceConstraint(p10, p7, p7, p4);

  relax.addEquivalenceConstraint(p1, p2, p2, p3);
  relax.addEquivalenceConstraint(p2, p3, p3, p4);
  relax.addEquivalenceConstraint(p5, p6, p6, p7);
};

