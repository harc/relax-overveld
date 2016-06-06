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
        this.dst = null;
        this.angleOffset = 0;
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
        context.lineWidth = 5;
        context.strokeStyle = (this.numPackets === 0) ? 'gray' : 'lime';
        context.lineTo(this.p2.x, this.p2.y);
        context.closePath();
        context.stroke();

        if (this.numPackets !== 0) {
            var angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            Triangle.draw({
                context: context,
                width: 30,
                x: this.dst.x,
                y: this.dst.y,
                angle: angle + this.angleOffset,
                color: 'lime',
            });
        }
    }
    
    serialize() {
        return [this.p1.name, this.p2.name].join(' ');
    }

    registerPrefix(src, announcement) {
        var dst = (src == this.p1.forwarder) ? this.p2.forwarder : this.p1.forwarder;
        console.log(src.node.name + " announcing " + announcement.prefix.toUri() + " to " + dst.node.name);
        return dst.registerPrefix(this, announcement);
    };

    sendInterest(src, interest) {
        this.dst = (src == this.p1.forwarder) ? this.p2 : this.p1;
        var dst = this.dst.forwarder;
        this.angleOffset = Math.PI;
        
        this.numPackets++;
        if (this.numPackets <= this.capacity) {
            return dst.receiveInterest(this, interest);
        }
    };

    sendData(src, data) {
        this.dst = (src == this.p1.forwarder) ? this.p2 : this.p1;
        var dst = this.dst.forwarder;
        this.angleOffset = 0;
        
        this.numPackets++;
        if (this.numPackets <= this.capacity) {
            return dst.receiveData(this, data);
        }
    };
}