//
// Inspired by: https://github.com/patrickhlauke/touch/
//
function addSwipe(el, callbacks) {
	var start = {};
	var end = {};
	var tracking = false;
	var thresholdTime = 500;
	var thresholdDistance = 50;

	function gestureStart(e) {
		tracking = true;
		/* Hack - would normally use e.timeStamp but it's whack in Fx/Android */
		start.t = new Date().getTime();
		start.x = e.clientX;
		start.y = e.clientY;
	};
	function gestureMove(e) {
		if (tracking) {
			e.preventDefault();
			end.x = e.clientX;
			end.y = e.clientY;
		}
	}
	function gestureEnd(e) {
		if (tracking) {
			tracking = false;
			var now = new Date().getTime();
			var deltaTime = now - start.t;
			var deltaX = end.x - start.x;
			var deltaY = end.y - start.y;
			/* work out what the movement was */
			if (deltaTime > thresholdTime) {
				/* gesture too slow */
				return;
			} else {
				if ((deltaX > thresholdDistance) && (Math.abs(deltaY) < thresholdDistance)) {
					callbacks.right && callbacks.right(e);
				} else if ((-deltaX > thresholdDistance) && (Math.abs(deltaY) < thresholdDistance)) {
					callbacks.left && callbacks.left(e);
				} else if ((deltaY > thresholdDistance) && (Math.abs(deltaX) < thresholdDistance)) {
					callbacks.down && callbacks.down(e);
				} else if ((-deltaY > thresholdDistance) && (Math.abs(deltaX) < thresholdDistance)) {
					callbacks.up && callbacks.up(e);
				}
			}
		}
	}

	el.addEventListener('pointerdown', gestureStart, false);
	el.addEventListener('pointermove', gestureMove, false);
	el.addEventListener('pointerup', gestureEnd, false);
	el.addEventListener('pointerleave', gestureEnd, false);
	el.addEventListener('pointercancel', gestureEnd, false);
}