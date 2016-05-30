/**
 * Created by lowellbander on 5/27/16.
 */

var NODE_TYPE = {
    CONSUMER : {value: 0, name: "Consumer", code: "C"},
    PRODUCER : {value: 1, name: "Producer", code: "P"},
};

class Node {
    constructor ({x, y, parameter=75}={}) {
        this.x = x;
        this.y = y;
        this.selectionIndices = [];
        this.name = 'Node' + getID();
        this.forwarder = new Forwarder(this);
        this.parameter = parameter;
        this.radius = 8;
    }
    
    serialize () {
        return [this.name, this.x, this.y, this.parameter].join(' ');
    }
    
    draw (context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
    }
}