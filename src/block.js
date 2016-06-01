var Block = function(block) {
    this.block = block || []    ;
};

Block.prototype = new Function();

Block.prototype.call =  function() {
    var next_block = [];
    for (var s of this.block) {
        var n = s.apply(this, arguments);
        if (n) {
            next_block.push(n);
        }
    }
    block = next_block;
    if (block && block.length > 0) {
        if (block.length == 1) {
            return block[0];
        }
        return new Block(block);
    }
};

Block.prototype.push = function (step) {
    this.block.push(step);
};