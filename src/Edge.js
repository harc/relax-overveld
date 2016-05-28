/**
 * Created by lowellbander on 5/27/16.
 */

class Edge {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    
    involvesPoint(p) {
        return p === this.p1 || p === this.p2;
    }
    
    serialize() {
        return [this.p1.name, this.p2.name].join(' ');
    }

    registerPrefix(src, prefix) {
        var dst = (src == this.node1) ? this.node2 : this.node1;
        dst.forwarder.registerPrefix(this, prefix)
    };

    sendInterest(src, interest) {
        var dst = (src == this.node1) ? this.node2 : this.node1;
        dst.forwarder.receiveInterest(this, interest);
    };

    sendData(src, data) {
        var dst = (src == this.node1) ? this.node2 : this.node1;
        dst.forwarder.receiveData(this, data);
    };
}