import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { CHANGES_NAMESPACE, invalidateCollectionQueries } from './helpers';
import { EJSON } from 'meteor/ejson';
import isString from 'lodash.isstring';
import { _ } from 'meteor/underscore';

const originalInsert = Mongo.Collection.prototype.insert;
const originalUpdate = Mongo.Collection.prototype.update;
const originalRemove = Mongo.Collection.prototype.remove;
Mongo.Collection.prototype.insert = function (doc, callback) {
  const returnValue = originalInsert.bind(this)(...arguments);
  if (this.shouldEmitEvents) {
    if (Meteor.isClient) return returnValue;
    import { Vent } from 'meteor/cultofcoders:redis-oplog';

    Vent.emit(CHANGES_NAMESPACE, {
      doc: {
        ...doc,
        _id: doc?._id,
      },
      e: 'i',
      n: this.collectionName,
    });
    return returnValue;
  }
  return returnValue;
};
Mongo.Collection.prototype.remove = function (selector, callback) {
  const returnValue = originalRemove.bind(this)(...arguments);

  if (this.shouldEmitEvents) {
    if (Meteor.isClient) return returnValue;

    const mongoSelector = isString(selector) ? { _id: selector } : selector;
    import { Vent } from 'meteor/cultofcoders:redis-oplog';

    this.find(mongoSelector).forEach(doc => {
      Vent.emit(CHANGES_NAMESPACE, {
        docId: doc?._id,
        e: 'r',
        n: this.collectionName,
      });
    });
    return returnValue;
  }
  return returnValue;
};
Mongo.Collection.prototype.update = function (selector, callback) {
  const returnValue = originalUpdate.bind(this)(...arguments);
  if (this.shouldEmitEvents) {
    if (Meteor.isClient) return returnValue;

    const mongoSelector = isString(selector) ? { _id: selector } : selector;
    import { Vent } from 'meteor/cultofcoders:redis-oplog';

    this.find(mongoSelector).forEach(doc => {
      Vent.emit(CHANGES_NAMESPACE, {
        doc,
        e: 'u',
        n: this.collectionName,
      });
    });
    return returnValue;
  }
  return returnValue;
};

_.extend(Mongo.Collection.prototype, {
  set(id, doc, skipInvalidate = false) {
    // this can't set directly on the ._map, as this is an data structure that needs to call set() and
    // setting directly here was breaking some of the mongo matcher logics
    this._collection._docs.set(id, EJSON.fromJSONValue(doc));
    if (!skipInvalidate) this.invalidate();
  },
  rawRemove(id) {
    this._collection._docs.remove(id);
    this.invalidate();
  },
  invalidate: invalidateCollectionQueries(this),
});
