examples.perspective = function() {
  var vp1 = rc.addPoint(300, 800);
  var vp2 = rc.addPoint(1100, 800);

  var centerFoot = rc.addPoint(600, 600);
  var leftFoot = rc.addPoint(500, 500);
  var rightFoot = rc.addPoint(900, 500);
  var backFoot = rc.addPoint(700, 467);

  var centerHead = rc.addPoint(600, 300);
  var leftHead = rc.addPoint(500, 350);
  var rightHead = rc.addPoint(900, 350);
  var backHead = rc.addPoint(700, 367);

  rc.addLine(vp1, centerFoot);
  rc.addLine(centerFoot, vp2);
  rc.addLine(vp1, centerHead);
  rc.addLine(centerHead, vp2);

  rc.addLine(leftFoot, centerFoot);
    rc.addLine(leftFoot, centerFoot);
    rc.addLine(leftFoot, centerFoot);
    rc.addLine(leftFoot, centerFoot);
  rc.addLine(rightFoot, centerFoot);
    rc.addLine(rightFoot, centerFoot);
    rc.addLine(rightFoot, centerFoot);
    rc.addLine(rightFoot, centerFoot);
  rc.addLine(leftFoot, backFoot);
    rc.addLine(leftFoot, backFoot);
    // rc.addLine(leftFoot, backFoot);
    // rc.addLine(leftFoot, backFoot);
  rc.addLine(rightFoot, backFoot);
    rc.addLine(rightFoot, backFoot);
    // rc.addLine(rightFoot, backFoot);
    // rc.addLine(rightFoot, backFoot);
  rc.addParallelConstraint(vp1, centerFoot, leftFoot, centerFoot);
  rc.addParallelConstraint(vp2, centerFoot, rightFoot, centerFoot);
  rc.addParallelConstraint(vp1, backFoot, backFoot, rightFoot);
  rc.addParallelConstraint(vp2, backFoot, backFoot, leftFoot);

  rc.addLine(leftHead, centerHead);
    rc.addLine(leftHead, centerHead);
    rc.addLine(leftHead, centerHead);
    rc.addLine(leftHead, centerHead);
  rc.addLine(rightHead, centerHead);
    rc.addLine(rightHead, centerHead);
    rc.addLine(rightHead, centerHead);
    rc.addLine(rightHead, centerHead);
  rc.addLine(leftHead, backHead);
    rc.addLine(leftHead, backHead);
    // rc.addLine(leftHead, backHead);
    // rc.addLine(leftHead, backHead);
  rc.addLine(rightHead, backHead);
    rc.addLine(rightHead, backHead);
    // rc.addLine(rightHead, backHead);
    // rc.addLine(rightHead, backHead);
  rc.addParallelConstraint(vp1, centerHead, leftHead, centerHead);
  rc.addParallelConstraint(vp2, centerHead, rightHead, centerHead);
  rc.addParallelConstraint(vp1, backHead, backHead, rightHead);
  rc.addParallelConstraint(vp2, backHead, backHead, leftHead);

  rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
    rc.addLine(leftFoot, leftHead);
  rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
    rc.addLine(centerFoot, centerHead);
  rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
    rc.addLine(rightFoot, rightHead);
  rc.addLine(backFoot, backHead);
    rc.addLine(backFoot, backHead);
    rc.addLine(backFoot, backHead);
    // rc.addLine(backFoot, backHead);
    // rc.addLine(backFoot, backHead);
  rc.addParallelConstraint(leftHead, leftFoot, centerHead, centerFoot);
  rc.addParallelConstraint(rightHead, rightFoot, centerHead, centerFoot);
  rc.addParallelConstraint(backHead, backFoot, centerHead, centerFoot);

  // try to keep the center line the same length at all times
  var l = Relax.geom.magnitude(Relax.geom.minus(centerHead, centerFoot));
  rc.addLengthConstraint(centerFoot, centerHead, l);

  // add lines in the back
  rc.addLine(vp1, rightFoot);
  rc.addLine(vp2, leftFoot);
  rc.addLine(vp1, rightHead);
  rc.addLine(vp2, leftHead);

  // keep vertical lines upright
  var upright = rc.addPoint(-50, 550);
  var downright = rc.addPoint(-50, 650);
  rc.addLine(upright, downright);
  rc.addCoordinateConstraint(upright, -50, 550);
  rc.addCoordinateConstraint(downright, -50, 650);
  rc.addParallelConstraint(upright, downright, centerHead, centerFoot);
};

