var Block = function(block) {
    if (block.length == 1) {
        return block[0];
    }
    this.block = block;
};

Block.prototype = new Function();

Block.prototype.call =  function() {
    var next_block = [];
    for (var s of this.block) {
        var n = s.call();
        if (n) {
            next_block.push(n);
        }
    }
    block = next_block;
    if (block && block.length > 0) {
        if (block.length == 1) {
            return block[0];
        }
        this.block = block;
        return this;
    }
}