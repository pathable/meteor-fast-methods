import './lib/mongo-collections-map';
import './lib/mongo-collections-names';
import { CHANGES_METHOD_NAME, fillMiniMongo } from './lib/helpers';
Meteor.startup(() => {
  fillMiniMongo();
  import { Vent } from 'meteor/cultofcoders:redis-oplog';

  const handler = Vent.subscribe(CHANGES_METHOD_NAME);
  handler.listen(({ doc, docId, e: event, n: collectionName }) => {
    if (event === 'r') {
      getCollectionByName(collectionName).rawRemove(docId);
      return;
    }
    getCollectionByName(collectionName).set(doc?._id, doc);
  });
});
