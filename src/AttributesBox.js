/**
 * Created by lowellbander on 5/27/16.
 */

class AttributesBox {
    constructor(node) {
        this.node = node;
        this.id = 'attrBox-' + this.node.name;
    }
    
    toggle() {
        var box = document.getElementById(this.id);
        if (box) this.hide(); else this.show();
    }
    
    hide () {
        document.body.removeChild(document.getElementById(this.id));
    }
    
    show() {
        this.build();
        document.body.appendChild(this.box);
    }
    
    build () {
        this.box = document.createElement("div");
        var offset = 10;
        this.box.style.top = this.node.y + offset;
        this.box.style.left = this.node.x + offset;
        this.box.style.position = 'absolute';
        this.box.id = this.id;
        
        this.node.fields().forEach(_ => this.addTextInput(_));
        
        document.body.appendChild(this.box);
    }
    
    addLabel(label) {
        var element = document.createElement('label');
        element.innerHTML = label + ' ';
        this.render(element);
    }
    
    addTextInput({label, defaultValue, onChange}={}) {
        this.addLabel(label);
        var input = document.createElement('input');
        input.setAttribute('value', defaultValue);
        input.onkeyup = onChange;
        this.render(input);
        this.addBreak();
    }
    
    addBreak() {
        this.render(document.createElement('br'));
    }
    
    addRangeInput({label, defaultValue, onChange, min=0, max=100}={}) {
        this.addLabel(label);
        var range = document.createElement('input');
        range.setAttribute('type', 'range');
        range.setAttribute('value', defaultValue);
        range.setAttribute('min', min);
        range.setAttribute('max', max);
        range.oninput = onChange;
        this.render(range);
        this.addBreak();
    }
    
    render(element) {
        this.box.appendChild(element);
    }
}