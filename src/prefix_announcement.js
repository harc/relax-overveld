/**
 * Created by mickey on 5/31/16.
 */

class PrefixAnnouncement {
  constructor(prefix) {
      this.prefix = prefix;
      this.nounce = getNounce();
  }
};