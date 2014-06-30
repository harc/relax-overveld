examples.chain = function() {
  var p1 = relax.addPoint(200,  200);
  var p2 = relax.addPoint(300,  200);
  var p3 = relax.addPoint(400,  200);
  var p4 = relax.addPoint(500,  200);
  var p5 = relax.addPoint(600,  200);
  var p6 = relax.addPoint(700,  200);
  var p7 = relax.addPoint(800,  200);
  var p8 = relax.addPoint(900,  200);
  var p9 = relax.addPoint(1000, 200);

  relax.addLine(p1, p2);
  relax.addLine(p2, p3);
  relax.addLine(p3, p4);
  relax.addLine(p4, p5);
  relax.addLine(p5, p6);
  relax.addLine(p6, p7);
  relax.addLine(p7, p8);
  relax.addLine(p8, p9);

  relax.addLengthConstraint(p1, p2, 100);
  relax.addLengthConstraint(p2, p3, 100);
  relax.addLengthConstraint(p3, p4, 100);
  relax.addLengthConstraint(p4, p5, 100);
  relax.addLengthConstraint(p5, p6, 100);
  relax.addLengthConstraint(p6, p7, 100);
  relax.addLengthConstraint(p7, p8, 100);
  relax.addLengthConstraint(p8, p9, 100);
};

