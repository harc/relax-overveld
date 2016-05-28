/**
 * Created by lowellbander on 5/28/16.
 */

class Marquee {
    constructor({x, y, addNode}={}) {
        this.x = x;
        this.y = y;
        this.addNode = addNode;
        
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
        this.nodes = nodes.filter(this.inBounds).map(_ => Object.assign({}, _));
    }
    
    paste({x, y}={}) {
        var minX = Math.min(...this.nodes.map(_ => _.x));
        var minY = Math.min(...this.nodes.map(_ => _.y));
        this.nodes.map(function (node) {
            var node = Object.assign({}, node);
            node.x = node.x - minX + x;
            node.y = node.y - minY + y;
            return node;
        }).forEach(node => this.addNode(node.x, node.y));
    }
}
