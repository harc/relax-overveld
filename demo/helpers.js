/**
 * Created by mickey on 6/4/16.
 */
class Helpers {
    static producedContent() {
        return Producers.map(n => n.data.name)
            .reduce((uniq, name) => uniq.filter(n => n.name !== name.name).concat(name), []);
    };

    static consumeAll(node) {
        var names = new Queue();
        Helpers.producedContent().map(n => names.push(n));
        var step = function (names) {
            if (!names.empty()) {
                return node.sendInterest(new Interest(names.pop()));
            }
            else {
                node.onStep = undefined;
            }
        };
        return new Block(step).bind(node, names);
    };
}