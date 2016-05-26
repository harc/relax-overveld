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
}

module.exports = Forwarder;
