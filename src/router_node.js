/**
 * Created by mickey on 5/28/16.
 */

class RouterNode extends Node {
    constructor() {
        super(arguments[0]);
        this.color = 'black';
        this.forwarder =  new Router(this);
    }

    start() {
    }
    
    drawAttributes(context) {
        context.fillText('Router: ' + this.name, this.x + this.offset, this.y - this.offset);
    }
    
    fields() {
        return [
            Field.name(this),
        ];
    }
}