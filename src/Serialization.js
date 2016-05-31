/**
 * Created by lowellbander on 5/27/16.
 */

class Serialization {
    
    constructor(context) {
        this.x = 10;
        this.y = 250;
        this.lineOffset = 15;
        this.context = context;
        this.context.fillStyle = 'black';
        this.context.font = 'monospace';
        
        this.writeLine = this.writeLine.bind(this);
        
        this.nodeHeader = '#Name X Y Param';
        this.edgeHeader = '#Src Dst';
    }
    
    draw ({nodes, edges}={}) {
        this.writeLine(this.nodeHeader);
        nodes.map(_ => _.serialize()).forEach(this.writeLine);
        this.writeLine(this.edgeHeader);
        edges.map(_ => _.serialize()).forEach(this.writeLine);
    }

    getOffset() {
        var oldY = this.y;
        this.y += this.lineOffset;
        return oldY;
    }
    
    writeLine(line) {
        this.context.fillText(line, this.x, this.getOffset());
    }
}

