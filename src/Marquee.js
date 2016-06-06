/**
 * Created by lowellbander on 5/28/16.
 */

class Marquee {
    constructor({x, y, addNode, addEdge}={}) {
        this.x = x;
        this.y = y;
        this.addNode = addNode;
        this.addEdge = addEdge;
        
        this.width = 40;
        this.height = 40;
        this.nodes = [];
        this.edges = [];

        this.inBounds = this.inBounds.bind(this);
        this.paste = this.paste.bind(this);
    }
    
    update({x, y}={}) {
        this.width = x - this.x;
        this.height = y - this.y;
    }
    
    draw(context) {
        context.lineWidth = 4;
        context.strokeStyle = "blue";
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        context.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    bounds() {
        var left, right, top, bottom;
        if (this.width > 0) {
            left = this.x;
            right = this.x + this.width;
        } else {
            right = this.x;
            left = this.x + this.width;
        }
        if (this.height > 0) {
            top = this.y;
            bottom = this.y + this.height;
        } else {
            bottom = this.y;
            top = this.y + this.height;
        }
        return {
            left: left,
            right: right,
            top: top,
            bottom: bottom,
        };
    }
    
    inBounds(point) {
        var {left, right, top, bottom} = this.bounds();
        var x = point.x,
            y = point.y;
        return (x > left) && (x < right) && (y > top) && (y < bottom);
    }
    
    copy({nodes, edges}={}) {
        // copy nodes
        this.nodes = nodes.filter(this.inBounds);
        // copy edges
        this.edges = edges.filter(edge => {
            var {node1, node2} = edge.nodes();
            return this.nodes.includes(node1) && this.nodes.includes(node2);
        });
    }
    
    paste({x, y}={}) {
        // paste nodes
        var minX = Math.min(...this.nodes.map(_ => _.x));
        var minY = Math.min(...this.nodes.map(_ => _.y));
        var oldToNew = new Map();
        this.nodes.forEach(node => {
            var newX = node.x - minX + x;
            var newY = node.y - minY + y;
            var newNode = this.addNode(newX, newY, node.type);
            oldToNew.set(node, newNode);
        });
        // paste edges
        this.edges.forEach(edge => {
           var {node1, node2} = edge.nodes();
           this.addEdge(oldToNew.get(node1), oldToNew.get(node2));
        });
    }
}
