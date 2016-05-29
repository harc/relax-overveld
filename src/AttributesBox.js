/**
 * Created by lowellbander on 5/27/16.
 */

class AttributesBox {
    constructor(node) {
        this.box = document.createElement("div");
        this.node = node;

        var offset = 10;
        this.box.style.top = this.node.y + offset;
        this.box.style.left = this.node.x + offset;
        this.box.style.position = 'absolute';
    }
    
    draw () {
        this.addLabel('Name ');
        this.addTextInput({
            defaultValue: this.node.name,
            onChange: e => this.node.name = e.target.value,
        });
        this.addBreak();
        this.addRangeInput({
            defaultValue: this.node.parameter,
            onChange: e => this.node.parameter = e.target.value,
            min: 0,
            max: 100,
        });
        
        document.body.appendChild(this.box);
    }
    
    addLabel(label) {
        var element = document.createElement('label');
        element.innerHTML = label;
        this.box.appendChild(element);
    }
    
    addTextInput({defaultValue, onChange}={}) {
        var input = document.createElement('input');
        input.setAttribute('value', defaultValue);
        input.onkeyup = onChange;
        this.box.appendChild(input);
    }
    
    addBreak() {
        this.box.appendChild(document.createElement('br'));
    }
    
    addRangeInput({defaultValue, onChange, min=0, max=100}={}) {
        var range = document.createElement('input');
        range.setAttribute('type', 'range');
        range.setAttribute('value', defaultValue);
        range.setAttribute('min', min);
        range.setAttribute('max', max);
        range.oninput = onChange;
        this.box.appendChild(range);
    }
}