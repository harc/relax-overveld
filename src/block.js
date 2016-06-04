var Block = function(block) {
    if (Block.isBlock(block)) {
        this.block   = block.block;
        this.thisArg = block.thisArg;
        this.args    = block.args;
    }
    else {
        this.block = block === undefined ? []
            : Array.isArray(block) ? block
            : /* default */        [block];
    }
};

Block.prototype = new Function();

Block.isBlock = function (block) {
  return block.block;
};

Block.prototype.apply =  function(thisArgs, args) {
    var next_block = [];
    for (var s of this.block) {
        var n = s.apply(thisArgs, args);
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
}

Block.prototype.call =  function() {
    var next_block = [];
    for (var s of this.block) {
        var n;
        if (Block.isBlock(s)) {
            n = s.call();
        }
        else {
            n = s.apply(this.thisArg, this.args);
        }   
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
    return this;
};

Block.prototype.bind = function() {
    var args = Array.prototype.slice.call(arguments);
    this.thisArg = args.shift()
    this.args = args;
    return this;
};

Block.prototype.pop = function (step) {
    this.block.pop();
    return this;
};