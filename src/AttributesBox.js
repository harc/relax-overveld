/**
 * Created by lowellbander on 5/27/16.
 */

class AttributesBox {
    
    static draw (node) {
        var box = document.createElement("div");
        box.setAttribute('id', 'attr');
        box.setAttribute('style', 'z-index: 2000;');
        box.style.position = 'absolute';
        box.style.top = node.y;
        box.style.left = node.x;
        
        var name = document.createElement("input");
        name.setAttribute('value', node.name);
        name.onchange = function (e) {
            node.name = e.target.value
        }.bind(this);
        box.appendChild(name);

        var parameter = document.createElement("input");
        parameter.setAttribute("type", "range");
        parameter.setAttribute("value", node.parameter);
        parameter.setAttribute("min", "0");
        parameter.setAttribute("max", "100");
        parameter.onchange = function (e) {
            node.parameter = e.target.value;
        }.bind(this);
        box.appendChild(parameter);

        document.body.appendChild(box);
    }
}