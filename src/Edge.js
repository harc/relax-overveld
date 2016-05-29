/**
 * Created by lowellbander on 5/27/16.
 */

class Edge {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
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
    
    serialize() {
        return [this.p1.name, this.p2.name].join(' ');
    }
}