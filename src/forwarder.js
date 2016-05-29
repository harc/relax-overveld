class Forwarder {
    constructor(node) {
        this.links = [];
        this.fib = [];
        // dictionary of prefixes to links
        this.dict = [];
        this.pit = [];
    };

    addLink(link) {
        this.links.push(link);
    }

    announcePrefix(src, prefix) {
        for (var link of this.links) {
            if (link != src) {
                link.registerPrefix(this, prefix);
            }
        }
    }

    registerPrefix(link, prefix) {
        this.fib.push(prefix);
        this.dict[prefix.toUri()] = link;
    }

    sendInterest(src, interest) {
        var dst = this.dict[interest.name.toUri()];
        if (dst) {
            this.pit[interest.name] = src;
            return dst.sendInterest(this, interest);
        }
        // var longestPrefixMatchIndex = this.findLongestPrefixMatch(interest.name);
        // if (longestPrefixMatchIndex !== -1) {
        //     var longestPrefix = this.fib[longestPrefixMatchIndex];
        //     var link = this.dict[longestPrefix];
        //     if (link) {
        //         return link.sendInterest(this, interest);
        //     }
        // }
    }

    receiveInterest(link, interest) {
        if (!this.pit[interest]) {
            this.pit[interest] = [];
        }
        this.pit[interest].push(link);
        var dst = this.dict[interest.name.toUri()];
        if (dst) {
            return dst.receiveInterest(interest);
        }
    }

    receiveData(link, data) {
        var dst = this.pit[data.name];
        if (dst) {
            return dst.receiveData(data);
        }
    }

    sendData(interest, data) {
        var links = this.pit[interest];
        if (links) {
            var block = [];
            for (var link of links) {
                block.push(link.sendData(this, data));
            }
            delete this.pit[interest];
        }
        if (block && block.length > 0) {
            return function() {
                for (var s of block) {
                    s.call()
                }
            }.bind(this)
        }
        return undefined;
    }

    findLongestPrefixMatch(name) {
        var arrayOfNameComponents = name.toUri().split("/");
        var longestPrefixMatchIndex = -1;
        var maximumMatchedComponents = -1;
        var fibEntryCounter = -1;
        for (var fibEntry of this.fib) {
            fibEntryCounter += 1;
            var currentMatchedComponents = 0;
            var entryNameComponents = fibEntry.toUri().split("/");
            //console.log(entryNameComponents);
            for (var i = 0; i < arrayOfNameComponents.length; i++) {
              if (entryNameComponents[i] === arrayOfNameComponents[i]) {
                // console.log(entryNameComponents[i]);
                // console.log(arrayOfNameComponents[i]);
                currentMatchedComponents += 1;
              }
              else {
                  currentMatchedComponents = -2;
                  break;
              }
            }
            if (currentMatchedComponents >= maximumMatchedComponents) {
              maximumMatchedComponents = currentMatchedComponents;
              longestPrefixMatchIndex = fibEntryCounter;
            }
        }
        return longestPrefixMatchIndex;
    }

}

class LocalForwarder extends Forwarder {
    constructor(node) {
        super(arguments[0]);
        this.node = node;
    };

    announcePrefix(prefix) {
        super.registerPrefix(this.node, prefix);
        return super.announcePrefix(this.node, prefix);
    };

    sendInterest(interest) {
        return super.sendInterest(this.node, interest);
    }
}