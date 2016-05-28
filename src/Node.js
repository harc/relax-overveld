/**
 * Created by lowellbander on 5/27/16.
 */

var NODE_TYPE = {
    CONSUMER : {value: 0, name: "Consumer", code: "C"},
    PRODUCER : {value: 1, name: "Producer", code: "P"},
};

class Node {
    constructor ({x, y, optColor, parameter=75}={}) {
        this.x = x;
        this.y = y;
        this.color = optColor || 'slateBlue';
        this.selectionIndices = [];
        this.name = 'Node' + getID();
        this.forwarder = new Forwarder(this);
        this.parameter = parameter;
    }
    
    serialize () {
        return [this.name, this.x, this.y, this.parameter].join(' ');
    }
}