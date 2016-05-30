class Forwarder {
    constructor(node) {
        this.links = [];
        this.fib = [];
        // dictionary of prefixes to links
        this.dict = [];
        this.pit = [];
    };

    shouldForward(interest) {
        return !this.pit[interest.name.toUri()]
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
        var interestName = interest.name.toUri();
        var longestPrefixMatchIndex = this.findLongestPrefixMatch(interest.name);
        if (longestPrefixMatchIndex !== -1) {
            var longestPrefix = this.fib[longestPrefixMatchIndex];
            var dst = this.dict[interestName];
            if (dst) {
              // interest aggregation
              if (!this.pit[interestName]) {
                  this.pit[interestName] = [src];
                  return dst.sendInterest(this, interest);
              }
              else {
                  this.pit[interestName].push(src);
              }
            }
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
        var interestName = interest.name.toUri();
        if (!this.pit[interestName]) {
            this.pit[interestName] = [];
        }
        this.pit[interestName].push(link);
        var dst = this.dict[interestName];
        if (dst) {
            return dst.receiveInterest(interest);
        }
    }

    receiveData(link, data) {
        var links = this.pit[data.name.toUri()];
        if (links) {
            var block = [];
            for (var link of links) {
                var n = link.receiveData(data)
                if (n) {
                    block.push(n);
                }
            }
        }
        if (block && block.length > 0) {
            return new Block(block);
        }
        return undefined;
    }

    sendData(interestName, data) {
        var intrestName = interestName.toUri();
        var links = this.pit[interestName];
        if (links) {
            var block = [];
            for (var link of links) {
                var  n = link.sendData(this, data)
                if (n) {
                    block.push(n);
                }

            }
            delete this.pit[interestName];
        }
        if (block && block.length > 0) {
            return new Block(block);
        }
        return undefined;
    }

    sendData(interestName, data) {
        var interestName = interestName.toUri();
        var links = this.pit[interestName];
        if (links) {
            var block = [];
            for (var link of links) {
                var  n = link.sendData(this, data)
                if (n) {
                    block.push(n);
                }
            }
            delete this.pit[interestName];
        }
        if (block && block.length > 0) {
            return new Block(block);
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

class Router extends Forwarder {
    constructor(node) {
        super(arguments[0]);
        this.node = node;
    }

    registerPrefix(src, prefix) {
        this.fib.push(prefix);
        this.dict[prefix.toUri()] = src;
        for (var link of this.links) {
            if (link != src) {
                link.registerPrefix(this, prefix);
            }
        }
    }

    receiveInterest(link, interest) {
        return function() {
            if (this.shouldForward(interest)) {
                console.log(this.node.name + " forwarding Interest: " + JSON.stringify(interest)
                       + " to " + this.dict[interest.name.toUri()].name );
            }
            else {
                console.log(this.node.name + " aggregated Interest: " + JSON.stringify(interest));
            }
            return this.sendInterest(link, interest);
        }.bind(this);
    }

    receiveData(link, data) {
        return function() {
            var links = this.pit[data.name.toUri()];
            var links_str = "{ "
            for (var l of links) {
                links_str += ( l.name + ", ");
            }
            links_str = links_str.replaceAt([links_str.length - 2], " }");
            console.log(this.node.name + " forwarding Data: " + JSON.stringify(data) + " to "+ links_str);
            return this.sendData(data.name, data);
        }.bind(this);
    }
}
