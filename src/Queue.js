class Queue {
    constructor() {
        this.items = []
    };

    push(val) {
        return this.items.push(val);
    };

    pop() {
        return this.items.shift();
    };

    empty() {
        return !this.items || this.items.length == 0;
    };
}