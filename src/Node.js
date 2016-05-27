/**
 * Created by lowellbander on 5/27/16.
 */

class Node {
    constructor ({x, y, optColor}={}) {
        this.x = x;
        this.y = y;
        this.color = optColor || 'slateBlue';
        this.selectionIndices = [];
        this.name = 'Node' + getID();
    }
}