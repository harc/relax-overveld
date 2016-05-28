/**
 * Created by lowellbander on 5/27/16.
 */

class AttributesBox {
    
    constructor (node) {
        this.node = node;
    }
    
    draw () {
        var btn = document.createElement("BUTTON");
        btn.setAttribute('style', 'z-index: 2000;');
        btn.style.position = 'absolute';
        btn.style.top = this.node.y;
        btn.style.left = this.node.x;
        var t = document.createTextNode("CLICK MEH");
        btn.appendChild(t);
        document.body.appendChild(btn);
    }
}