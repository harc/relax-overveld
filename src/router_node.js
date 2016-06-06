/**
 * Created by mickey on 5/28/16.
 */

class RouterNode extends Node {
    constructor() {
        super(arguments[0]);
        this.color = 'black';
        this.forwarder = new Router(this);
        this.onStart = new Block(function () {});
    }

    
    drawAttributes(context) {
        context.fillText('Router: ' + this.name, this.x + this.offset, this.y - 2*this.offset);
        context.fillText('Cache: ' + Object.keys(this.forwarder.cache), this.x + this.offset, this.y - this.offset);
    }
    
    fields() {
        return [
            Field.name(this),
        ];
    }

    get type() {
        return NODE_TYPE.ROUTER;
    }

    get type() {
        return NODE_TYPE.ROUTER;
    }
}