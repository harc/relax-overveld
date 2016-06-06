/**
 * Created by lowellbander on 6/6/16.
 */

class Triangle {
    static draw({context, width, x, y, angle, color}) {
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-width, -width);
        context.lineTo(-width, width);
        context.lineTo(0, 0);
        context.fill();
        context.restore();
    }
}
