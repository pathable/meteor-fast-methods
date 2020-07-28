import './lib/mongo-collections-map';
import './lib/mongo-collections-names';
export { CachedValidatedMethod } from './lib/cached-method';
import './lib/override-mongo-behavior';
import { CHANGES_METHOD_NAME, fillMiniMongo } from './lib/helpers';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';
import './lib/auth';

FastMethods = {
  readyDependency: new Tracker.Dependency(),
  isReady: false,
  ready() {
    this.readyDependency.depend();
    return this.isReady;
  },
  handlers: [],
  initiallyLoggedIn: false,
  startListeningToChanges({ namespace, methodName = CHANGES_METHOD_NAME }) {
    import { Vent } from 'meteor/cultofcoders:redis-oplog';

    const handler = Vent.subscribe(methodName, { namespace });
    const getCollectionByName = Mongo.Collection.__getCollectionByName;
    handler.listen(({ doc: docString, docId, e: event, n: collectionName }) => {
      const collectionByName = getCollectionByName(collectionName);
      if (event === 'r') {
        collectionByName.rawRemove(docId);
        return;
      }
      const doc = EJSON.parse(docString);
      collectionByName.set(doc?._id, {
        ...doc,
        __noReset: true,
      });
    });
    this.handlers.push(handler);
    return handler;
  },
};

Meteor.startup(() => {
  fillMiniMongo();
});
