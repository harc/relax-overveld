/**
 * Created by lowellbander on 5/27/16.
 */

class Edge {
    constructor(p1, p2, optCapacity) {
        this.p1 = p1;
        this.p2 = p2;
        this.numPackets = 0;
        this.name = 'Edge' + getEdgeID();
        this.capacity = optCapacity || 1;
    }

    reset() {
        this.numPackets = 0;
    }
    
    involvesNode(p) {
        return p === this.p1 || p === this.p2;
    }
    
    nodes() {
        return {
            node1: this.p1,
            node2: this.p2,
        };
    }
    
    draw(context) {
        context.beginPath();
        context.moveTo(this.p1.x, this.p1.y);
        context.lineWidth = 3;
        context.strokeStyle = (this.numPackets === 0) ? 'gray' : 'red';
        context.lineTo(this.p2.x, this.p2.y);
        context.closePath();
        context.stroke();
    }
    
    serialize() {
        return [this.p1.name, this.p2.name].join(' ');
    }

    registerPrefix(src, prefix) {
        var dst = (src == this.p1.forwarder) ? this.p2.forwarder : this.p1.forwarder;
        return dst.registerPrefix(this, prefix)
    };

    sendInterest(src, interest) {
        var dst = (src == this.p1.forwarder) ? this.p2.forwarder : this.p1.forwarder;
        this.numPackets++;
        if (this.numPackets <= this.capacity) {
            return dst.receiveInterest(this, interest);
        }
    };

    sendData(src, data) {
        var dst = (src == this.p1.forwarder) ? this.p2.forwarder : this.p1.forwarder;
        this.numPackets++;
        if (this.numPackets <= this.capacity) {
            return dst.receiveData(this, data);
        }
    };
}