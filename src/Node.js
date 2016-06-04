/**
 * Created by lowellbander on 5/27/16.
 */

var NODE_TYPE = {
    CONSUMER : {value: 0, name: "Consumer", code: "C"},
    PRODUCER : {value: 1, name: "Producer", code: "P"},
    ROUTER   : {value: 2, name: "Router",   code: "R"},
};

class Node {
    constructor ({x, y, parameter=75}={}) {
        this.x = x;
        this.y = y;
        this.selectionIndices = [];
        this.name = 'Node' + getNodeID();
        this.parameter = parameter;
        this.radius = 8;
        this.offset = 15;
        this.attributesBox = new AttributesBox(this);
    }
    
    serialize () {
        return [
            this.name,
            Math.floor(this.x),
            Math.floor(this.y),
            this.parameter,
        ].join(' ');
    }

    start() {
        return this.onStart;
    };

    receiveInterest(interest) {
        return this.onInterestReceived.bind(this, interest);
    };

    receiveData(data) {
        return this.onData.bind(this, data);
    };
    
    draw (context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        
       this.drawAttributes(context);
    }
    
    drawAttributes() {
        throw "all subclasses of Node must implement .drawAttributes(context)";
    }
}