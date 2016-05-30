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
        this.addTextInput({
            label: 'Name',
            defaultValue: this.node.name,
            onChange: e => this.node.name = e.target.value,
        });
        this.addRangeInput({
            label: 'Param',
            defaultValue: this.node.parameter,
            onChange: e => this.node.parameter = e.target.value,
            min: 0,
            max: 100,
        });
        
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