examples.perspective = function() {
  var vp1 = rc.addPoint(300, 400);
  var vp2 = rc.addPoint(1100, 400);

  var centerFoot = rc.addPoint(700, 600);
  var leftFoot = rc.addPoint(500, 500);
  var rightFoot = rc.addPoint(900, 500);

  var centerHead = rc.addPoint(700, 300);
  var leftHead = rc.addPoint(500, 350);
  var rightHead = rc.addPoint(900, 350);

  rc.addLine(vp1, centerFoot);
  rc.addLine(centerFoot, vp2);
  rc.addLine(vp1, centerHead);
  rc.addLine(centerHead, vp2);

  rc.addLine(leftFoot, centerFoot);
  rc.addLine(rightFoot, centerFoot);
  rc.addParallelConstraint(vp1, centerFoot, leftFoot, centerFoot);
  rc.addParallelConstraint(vp2, centerFoot, rightFoot, centerFoot);

  rc.addLine(leftHead, centerHead);
  rc.addLine(rightHead, centerHead);
  rc.addParallelConstraint(vp1, centerHead, leftHead, centerHead);
  rc.addParallelConstraint(vp2, centerHead, rightHead, centerHead);

  rc.addLine(leftFoot, leftHead);
  rc.addLine(centerFoot, centerHead);
  rc.addLine(rightFoot, rightHead);
  rc.addParallelConstraint(leftHead, leftFoot, centerHead, centerFoot);
  rc.addParallelConstraint(rightHead, rightFoot, centerHead, centerFoot);

  // try to keep the center line the same length at all times
  var l = Relax.geom.magnitude(Relax.geom.minus(centerHead, centerFoot));
  rc.addLengthConstraint(centerFoot, centerHead, l);

  // add lines in the back
  rc.addLine(vp1, rightFoot);
  rc.addLine(vp2, leftFoot);
  rc.addLine(vp1, rightHead);
  rc.addLine(vp2, leftHead);
};

