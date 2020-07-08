import './lib/mongo-collections-map';
import './lib/mongo-collections-names';
export { CachedValidatedMethod } from './lib/cached-method';
import './lib/override-mongo-behavior';
import { CHANGES_METHOD_NAME, fillMiniMongo } from './lib/helpers';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker'

FastMethods = {
  readyDependency: new Tracker.Dependency(),
  isReady: false,
  ready: function () {
    this.readyDependency.depend();
    return this.isReady;
  },
};
Meteor.startup(() => {
  fillMiniMongo();
  import { Vent } from 'meteor/cultofcoders:redis-oplog';

  const handler = Vent.subscribe(CHANGES_METHOD_NAME);
  const getCollectionByName = Mongo.Collection.__getCollectionByName;
  handler.listen(({ doc, docId, e: event, n: collectionName }) => {
    if (event === 'r') {
      getCollectionByName(collectionName).rawRemove(docId);
      return;
    }
    getCollectionByName(collectionName).set(doc?._id, doc);
  });
});
