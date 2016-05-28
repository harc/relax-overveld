/**
 * Created by lowellbander on 5/27/16.
 */

class AttributesBox {
    
    constructor (node) {
        this.node = node;
    }
    
    draw () {
        var box = document.createElement("div");
        box.setAttribute('id', 'attr');
        box.setAttribute('style', 'z-index: 2000;');
        box.style.position = 'absolute';
        box.style.top = this.node.y;
        box.style.left = this.node.x;
        
        var name = document.createElement("input");
        name.setAttribute('value', this.node.name);
        name.onchange = function (e) {
            this.node.name = e.target.value
        }.bind(this);
        
        box.appendChild(name);
        
        document.body.appendChild(box);
    }
}