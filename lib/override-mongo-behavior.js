import { Mongo } from 'meteor/mongo';
import { EJSON } from 'meteor/ejson';

Object.assign(Mongo.Collection.prototype, {
  _maybeSetUpReplication(name, { _suppressSameNameError = false }) {
    const self = this;
    if (!(self._connection && self._connection.registerStore)) {
      return;
    }
    const ok = self._connection.registerStore(name, {
      beginUpdate(batchSize, reset) {
        if (batchSize > 1 || (reset && !self.__noReset))
          self._collection.pauseObservers();

        if (reset && !self.__noReset) self._collection.remove({});
      },
      update(msg) {
        const mongoId = msg.id;
        const doc = self._collection._docs.get(mongoId);

        // Is this a "replace the whole doc" message coming from the quiescence
        // of method writes to an object? (Note that 'undefined' is a valid
        // value meaning "remove it".)
        if (msg.msg === 'replace') {
          const replace = msg.replace;
          if (!replace) {
            if (doc) self._collection.remove(mongoId);
          } else if (!doc) {
            self._collection.insert(replace);
          } else {
            // XXX check that replace has no $ ops
            self._collection.update(mongoId, replace);
          }
        } else if (msg.msg === 'added') {
          if (doc) {
            if (doc.__noReset) {
              console.warn(
                'Expected not to find a document already present for an add',
                msg.collection
              );
              return;
            } else {
              throw new Error(
                'Expected not to find a document already present for an add',
                msg.collection
              );
            }
          }
          self._collection.insert({ _id: mongoId, ...msg.fields });
        } else if (msg.msg === 'removed') {
          if (!doc) {
            console.warn(
              'Expected to find a document already present for removed'
            );
            return;
          }
          self._collection.remove(mongoId);
        } else if (msg.msg === 'changed') {
          if (!doc) throw new Error('Expected to find a document to change');
          const keys = Object.keys(msg.fields);
          if (keys.length > 0) {
            const modifier = {};
            keys.forEach(key => {
              const value = msg.fields[key];
              if (EJSON.equals(doc[key], value)) {
                return;
              }
              if (typeof value === 'undefined') {
                if (!modifier.$unset) {
                  modifier.$unset = {};
                }
                modifier.$unset[key] = 1;
              } else {
                if (!modifier.$set) {
                  modifier.$set = {};
                }
                modifier.$set[key] = value;
              }
            });
            if (Object.keys(modifier).length > 0) {
              self._collection.update(mongoId, modifier);
            }
          }
        } else {
          throw new Error("I don't know how to deal with this message");
        }
      },

      // Called at the end of a batch of updates.
      endUpdate() {
        self._collection.resumeObservers();
      },

      // Called around method stub invocations to capture the original versions
      // of modified documents.
      saveOriginals() {
        self._collection.saveOriginals();
      },
      retrieveOriginals() {
        return self._collection.retrieveOriginals();
      },

      // Used to preserve current versions of documents across a store reset.
      getDoc(id) {
        return self.findOne(id);
      },

      // To be able to get back to the collection from the store.
      _getCollection() {
        return self;
      },
    });

    if (!ok) {
      const message = `There is already a collection named "${name}"`;
      if (_suppressSameNameError === true) {
        // XXX In theory we do not have to throw when `ok` is falsy. The
        // store is already defined for this collection name, but this
        // will simply be another reference to it and everything should
        // work. However, we have historically thrown an error here, so
        // for now we will skip the error only when _suppressSameNameError
        // is `true`, allowing people to opt in and give this some real
        // world testing.
        console.warn ? console.warn(message) : console.log(message);
      } else {
        throw new Error(message);
      }
    }
  },
});
