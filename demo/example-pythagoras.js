examples.pythagoras = function() {
  var a = rc.addPoint(400, 300);
  var b = rc.addPoint(600, 400);
  var c = rc.addPoint(400, 400);

  var ac1 = rc.addPoint(300, 300);
  var ac2 = rc.addPoint(300, 400);

  var bc1 = rc.addPoint(600, 600);
  var bc2 = rc.addPoint(400, 600);

  var ab1 = rc.addPoint(500, 100);
  var ab2 = rc.addPoint(700, 200);

  // triangle
  rc.addLine(a, b);
  rc.addLine(b, c);
  rc.addLine(c, a);
  rc.addPerpendicularConstraint(a, c, c, b);

  // ac square
  rc.addLine(a, ac1);
  rc.addLine(c, ac2);
  rc.addLine(ac1, ac2);
  rc.addParallelConstraint(a, c, ac1, ac2);
  rc.addParallelConstraint(ac1, a, ac2, c);
  rc.addPerpendicularConstraint(ac1, ac2, ac2, c);
  rc.addEqualDistanceConstraint(ac1, ac2, ac2, c);

  // bc square
  rc.addLine(b, bc1);
  rc.addLine(c, bc2);
  rc.addLine(bc1, bc2);
  rc.addParallelConstraint(b, c, bc1, bc2);
  rc.addParallelConstraint(b, bc1, c, bc2);
  rc.addPerpendicularConstraint(b, c, c, bc2);
  rc.addEqualDistanceConstraint(b, c, c, bc2);

  // ab square
  rc.addLine(a, ab1);
  rc.addLine(b, ab2);
  rc.addLine(ab1, ab2);
  rc.addParallelConstraint(a, b, ab1, ab2);
  rc.addParallelConstraint(a, ab1, b, ab2);
  rc.addPerpendicularConstraint(a, b, b, ab2);
  rc.addEqualDistanceConstraint(a, b, b, ab2);
};
