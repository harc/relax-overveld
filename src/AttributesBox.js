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

        var parameter = document.createElement("input");
        parameter.setAttribute("type", "range");
        parameter.setAttribute("value", this.node.parameter);
        parameter.setAttribute("min", "0");
        parameter.setAttribute("max", "100");
        parameter.onchange = function (e) {
            this.node.parameter = e.target.value;
        }.bind(this);
        box.appendChild(parameter);

        document.body.appendChild(box);
    }
}