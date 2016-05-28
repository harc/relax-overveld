/**
 * Created by lowellbander on 5/27/16.
 */

class Serialization {
    
    draw ({nodes, edges}={}) {
        var old = document.getElementById('serialization');
        if (old) old.parentNode.removeChild(old);

        var box = document.createElement("div");
        box.setAttribute('id', 'serialization');
        box.setAttribute('style', 'z-index: 2000;');
        box.style.position = 'absolute';
        box.style.top = 400;
        box.style.left = 30;
        box.style.fontFamily = 'monospace';
        
        appendText(box, '#Name X Y PARAM');
        nodes.map(n => n.serialize()).forEach(appendText.bind(null, box));
        appendText(box, '#Src Dst');
        edges.map(e => e.serialize()).forEach(appendText.bind(null, box));

        document.body.appendChild(box);
    }
}

function appendText(parent, text) {
    var p = document.createElement('p');
    p.innerHTML = text;
    parent.appendChild(p);
}
