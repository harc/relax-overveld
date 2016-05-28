class Forwarder {
    constructor(node) {
        this.node = node;
        this.links = [];
        this.fib = [];
        this.pit = [];
    };

    addLink(link) {
        this.links.push(link);
    }

    announcePrefix(prefix) {
        for (var link in this.links) {
            link.registerPrefix(this, prefix);
        }
    }

    registerPrefix(link, prefix) {
        this.fib[prefix] = link;
    }

    sendInterest(interest) {
        var link = this.fib[interest.name];
        if (link) {
            link.sendInterest(this, interest);
        }
    }

    receiveInterest(link, interest) {
        this.pit[interest] = link;
        this.node.receiveInterest(interest);
    }

    receiveData(link, data) {
        this.node.receiveData(data);
    }

    sendData(interest, data) {
        var link = this.pit[interest];
        if (link) {
            this.pit.remove(interest);
            link.sendData(this, data);
        }
    }

    findLongestPrefixMatch(name) {
        var arrayOfNameComponents = name.split("/");
        var longestPrefixMatchIndex = -1;
        var maximumMatchedComponents = -1;
        var fibEntryCounter = -1;
        var fibEntry;
        for (fibEntry of this.fib) {
            fibEntryCounter += 1;
            var currentMatchedComponents = 0;
            var entryNameComponents = fibEntry.split("/");
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
